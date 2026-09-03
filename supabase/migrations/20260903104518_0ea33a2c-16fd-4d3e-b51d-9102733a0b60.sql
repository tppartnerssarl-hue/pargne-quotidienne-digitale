-- 1. EPARGNANT : champs obligatoires + unicité CNI par agence
UPDATE public.epargnant SET telephone = 'À COMPLÉTER' WHERE telephone IS NULL OR btrim(telephone) = '';
UPDATE public.epargnant SET adresse = 'À COMPLÉTER' WHERE adresse IS NULL OR btrim(adresse) = '';
UPDATE public.epargnant SET numero_cni = 'À COMPLÉTER-' || numero_client WHERE numero_cni IS NULL OR btrim(numero_cni) = '';

ALTER TABLE public.epargnant
  ALTER COLUMN telephone SET NOT NULL,
  ALTER COLUMN adresse SET NOT NULL,
  ALTER COLUMN numero_cni SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_epargnant_cni_agence
  ON public.epargnant (id_agence, upper(btrim(numero_cni)))
  WHERE numero_cni NOT LIKE 'À COMPLÉTER%';

CREATE INDEX IF NOT EXISTS ix_epargnant_telephone ON public.epargnant (telephone);
CREATE INDEX IF NOT EXISTS ix_epargnant_cni ON public.epargnant (numero_cni);

CREATE OR REPLACE FUNCTION public.valider_epargnant()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.nom := btrim(NEW.nom);
  NEW.prenom := btrim(NEW.prenom);
  NEW.telephone := btrim(NEW.telephone);
  NEW.adresse := btrim(NEW.adresse);
  NEW.numero_cni := btrim(NEW.numero_cni);
  IF length(NEW.nom) = 0 OR length(NEW.prenom) = 0 THEN
    RAISE EXCEPTION 'Le nom et le prénom sont obligatoires';
  END IF;
  IF NEW.telephone NOT LIKE 'À COMPLÉTER%' THEN
    IF regexp_replace(NEW.telephone, '[^0-9]', '', 'g') !~ '^[0-9]{8,15}$' THEN
      RAISE EXCEPTION 'Numéro de téléphone invalide : 8 à 15 chiffres attendus';
    END IF;
  END IF;
  IF NEW.numero_cni NOT LIKE 'À COMPLÉTER%' AND length(NEW.numero_cni) < 4 THEN
    RAISE EXCEPTION 'Numéro de pièce d''identité invalide';
  END IF;
  IF length(NEW.adresse) < 3 THEN
    RAISE EXCEPTION 'L''adresse est obligatoire';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_valider_epargnant ON public.epargnant;
CREATE TRIGGER trg_valider_epargnant BEFORE INSERT OR UPDATE ON public.epargnant
FOR EACH ROW EXECUTE FUNCTION public.valider_epargnant();

-- 2. PRIX DU CARNET par agence, historisé
CREATE TABLE public.prix_carnet (
  id_prix uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  montant numeric(14,2) NOT NULL CHECK (montant >= 0),
  date_effet date NOT NULL DEFAULT current_date,
  id_utilisateur uuid REFERENCES public.utilisateur(id_utilisateur),
  commentaire text,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.prix_carnet TO authenticated;
GRANT ALL ON public.prix_carnet TO service_role;

ALTER TABLE public.prix_carnet ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_prix_read ON public.prix_carnet FOR SELECT TO authenticated
  USING (public.acces_agence(id_agence));
CREATE POLICY p_prix_ins ON public.prix_carnet FOR INSERT TO authenticated
  WITH CHECK (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')));
CREATE POLICY p_prix_upd ON public.prix_carnet FOR UPDATE TO authenticated
  USING (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')))
  WITH CHECK (public.acces_agence(id_agence));

CREATE INDEX ix_prix_carnet_agence ON public.prix_carnet (id_agence, date_effet DESC);

CREATE TRIGGER trg_prix_carnet_upd BEFORE UPDATE ON public.prix_carnet
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_no_delete_prix_carnet BEFORE DELETE ON public.prix_carnet
FOR EACH ROW EXECUTE FUNCTION public.interdit_suppression();

CREATE OR REPLACE FUNCTION public.prix_carnet_courant(_id_agence uuid)
RETURNS numeric LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT montant FROM public.prix_carnet
  WHERE id_agence = _id_agence AND actif AND date_effet <= current_date
  ORDER BY date_effet DESC, created_at DESC LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.definir_prix_carnet(_id_agence uuid, _montant numeric, _date_effet date DEFAULT CURRENT_DATE, _commentaire text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _id uuid;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')) THEN
    RAISE EXCEPTION 'Seul un responsable d''agence peut définir le prix du carnet';
  END IF;
  IF NOT public.acces_agence(_id_agence) THEN RAISE EXCEPTION 'Accès refusé à cette agence'; END IF;
  IF _montant IS NULL OR _montant <= 0 THEN RAISE EXCEPTION 'Le prix doit être strictement positif'; END IF;
  INSERT INTO public.prix_carnet (id_agence, montant, date_effet, id_utilisateur, commentaire)
  VALUES (_id_agence, _montant, COALESCE(_date_effet, current_date), _u, _commentaire)
  RETURNING id_prix INTO _id;
  RETURN _id;
END; $$;

-- 3. CARNETS : affectation à une collectrice et transfert
CREATE OR REPLACE FUNCTION public.affecter_livrets_collectrice(_id_collectrice uuid, _ids_livret uuid[], _commentaire text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _c record; _l record; _id uuid; _n int := 0;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas d''affecter des carnets';
  END IF;
  SELECT * INTO _c FROM public.utilisateur WHERE id_utilisateur = _id_collectrice;
  IF _c IS NULL THEN RAISE EXCEPTION 'Utilisateur destinataire introuvable'; END IF;
  IF NOT public.acces_agence(_c.id_agence) THEN RAISE EXCEPTION 'Accès refusé à cette agence'; END IF;
  FOREACH _id IN ARRAY _ids_livret LOOP
    SELECT * INTO _l FROM public.livret WHERE id_livret = _id FOR UPDATE;
    IF _l IS NULL THEN RAISE EXCEPTION 'Livret introuvable'; END IF;
    IF _l.statut <> 'EN_STOCK' THEN RAISE EXCEPTION 'Le livret % n''est plus en stock', _l.numero_livret; END IF;
    IF _l.id_agence <> _c.id_agence THEN RAISE EXCEPTION 'Le livret % n''appartient pas à l''agence de la collectrice', _l.numero_livret; END IF;
    UPDATE public.livret SET id_collectrice = _id_collectrice WHERE id_livret = _id;
    INSERT INTO public.mouvement_livret (id_livret, type_mouvement, statut_avant, statut_apres, id_utilisateur, id_agence, commentaire)
    VALUES (_id, 'AFFECTATION_COLLECTRICE', _l.statut, _l.statut, _u, _l.id_agence,
            COALESCE(_commentaire, '') || ' [Affecté à ' || _c.prenom || ' ' || _c.nom || ']');
    _n := _n + 1;
  END LOOP;
  RETURN _n;
END; $$;

CREATE OR REPLACE FUNCTION public.transferer_livret(_id_livret uuid, _id_collectrice uuid, _motif text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _l record; _c record;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas de transférer un carnet';
  END IF;
  IF _motif IS NULL OR length(btrim(_motif)) = 0 THEN RAISE EXCEPTION 'Le motif du transfert est obligatoire'; END IF;
  SELECT * INTO _l FROM public.livret WHERE id_livret = _id_livret FOR UPDATE;
  IF _l IS NULL THEN RAISE EXCEPTION 'Livret introuvable'; END IF;
  IF NOT public.acces_agence(_l.id_agence) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT * INTO _c FROM public.utilisateur WHERE id_utilisateur = _id_collectrice;
  IF _c IS NULL THEN RAISE EXCEPTION 'Collectrice destinataire introuvable'; END IF;
  IF _c.id_agence <> _l.id_agence THEN RAISE EXCEPTION 'Transfert impossible vers une autre agence'; END IF;
  UPDATE public.livret SET id_collectrice = _id_collectrice WHERE id_livret = _id_livret;
  INSERT INTO public.mouvement_livret (id_livret, type_mouvement, statut_avant, statut_apres, id_utilisateur, id_agence, commentaire)
  VALUES (_id_livret, 'TRANSFERT', _l.statut, _l.statut, _u, _l.id_agence,
          'Transféré à ' || _c.prenom || ' ' || _c.nom || ' — ' || _motif);
  RETURN _id_livret;
END; $$;

-- 4. JOURNAL D'ACTIVITÉ enrichi
ALTER TABLE public.audit
  ADD COLUMN IF NOT EXISTS id_agence uuid REFERENCES public.agence(id_agence),
  ADD COLUMN IF NOT EXISTS code_role text,
  ADD COLUMN IF NOT EXISTS resultat text NOT NULL DEFAULT 'SUCCES',
  ADD COLUMN IF NOT EXISTS contexte text;

CREATE INDEX IF NOT EXISTS ix_audit_agence ON public.audit (id_agence, date_action DESC);

CREATE OR REPLACE FUNCTION public.journaliser()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id text; _row jsonb; _ag uuid; _role text; _u uuid;
BEGIN
  _row := COALESCE(to_jsonb(NEW), to_jsonb(OLD));
  _id := _row ->> (TG_ARGV[0]);
  _u := public.utilisateur_courant();
  BEGIN
    _ag := NULLIF(_row ->> 'id_agence', '')::uuid;
  EXCEPTION WHEN others THEN _ag := NULL;
  END;
  IF _ag IS NULL THEN _ag := public.agence_courante(); END IF;
  SELECT string_agg(r.code, ',' ORDER BY r.code) INTO _role
    FROM public.utilisateur_role ur JOIN public.role r ON r.id_role = ur.id_role
   WHERE ur.id_utilisateur = _u;
  INSERT INTO public.audit (id_utilisateur, auth_user_id, action, table_cible, id_cible,
    ancienne_valeur, nouvelle_valeur, id_agence, code_role, resultat)
  VALUES (_u, auth.uid(), TG_OP, TG_TABLE_NAME, _id,
          CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
          CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
          _ag, _role, 'SUCCES');
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP POLICY IF EXISTS p_audit_read ON public.audit;
CREATE POLICY p_audit_read ON public.audit FOR SELECT TO authenticated
  USING (public.voit_tout() OR (public.a_role('RESPONSABLE_AGENCE') AND id_agence = public.agence_courante()));

CREATE TRIGGER trg_audit_prix_carnet AFTER INSERT OR UPDATE ON public.prix_carnet
FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_prix');

CREATE TRIGGER trg_audit_mouvement_livret AFTER INSERT ON public.mouvement_livret
FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_mouvement');