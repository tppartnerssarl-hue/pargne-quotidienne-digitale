-- Séquences de références
CREATE SEQUENCE public.seq_reference_operation START 1;
CREATE SEQUENCE public.seq_reference_commission START 1;
CREATE SEQUENCE public.seq_reference_remise START 1;
CREATE SEQUENCE public.seq_numero_client START 1;

CREATE OR REPLACE FUNCTION public.generer_reference(_prefixe text, _seq regclass)
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT _prefixe || to_char(now(),'YYYYMM') || '-' || lpad(nextval(_seq)::text, 6, '0');
$$;

-- ============ VUES CALCULEES ============
CREATE VIEW public.v_solde_livret WITH (security_invoker = on) AS
SELECT l.id_livret,
       l.numero_livret,
       l.id_agence,
       l.id_epargnant,
       COALESCE(SUM(CASE WHEN t.sens = 'CREDIT' THEN o.montant ELSE -o.montant END), 0)::numeric(14,2) AS solde,
       COALESCE(SUM(CASE WHEN t.sens = 'CREDIT' THEN o.montant ELSE 0 END), 0)::numeric(14,2) AS total_credit,
       COALESCE(SUM(CASE WHEN t.sens = 'DEBIT' THEN o.montant ELSE 0 END), 0)::numeric(14,2) AS total_debit,
       MAX(o.date_operation) AS derniere_operation
FROM public.livret l
LEFT JOIN public.operation o ON o.id_livret = l.id_livret AND o.statut = 'VALIDEE'
LEFT JOIN public.type_operation t ON t.code_type = o.code_type
GROUP BY l.id_livret, l.numero_livret, l.id_agence, l.id_epargnant;

CREATE VIEW public.v_situation_individuelle WITH (security_invoker = on) AS
SELECT o.id_operation, l.id_livret, l.numero_livret, e.id_epargnant, e.nom, e.prenom, e.numero_client,
       o.id_agence, o.date_operation, o.reference, o.code_type, t.libelle AS libelle_type,
       CASE WHEN t.sens = 'CREDIT' THEN o.montant ELSE 0 END::numeric(14,2) AS montant_credit,
       CASE WHEN t.sens = 'DEBIT' THEN o.montant ELSE 0 END::numeric(14,2) AS montant_debit,
       SUM(CASE WHEN t.sens = 'CREDIT' THEN o.montant ELSE -o.montant END)
         OVER (PARTITION BY l.id_livret ORDER BY o.date_operation, o.date_creation, o.id_operation)::numeric(14,2) AS solde_progressif
FROM public.operation o
JOIN public.livret l ON l.id_livret = o.id_livret
LEFT JOIN public.epargnant e ON e.id_epargnant = l.id_epargnant
JOIN public.type_operation t ON t.code_type = o.code_type
WHERE o.statut = 'VALIDEE';

CREATE VIEW public.v_stock_agence WITH (security_invoker = on) AS
SELECT a.id_agence, a.code, a.nom,
       COUNT(l.id_livret) AS total_recu,
       COUNT(*) FILTER (WHERE l.statut = 'EN_STOCK') AS disponible,
       COUNT(*) FILTER (WHERE l.statut = 'ATTRIBUE') AS attribue,
       COUNT(*) FILTER (WHERE l.statut = 'ACTIF') AS actif,
       COUNT(*) FILTER (WHERE l.statut = 'BLOQUE') AS bloque,
       COUNT(*) FILTER (WHERE l.statut = 'CLOTURE') AS cloture,
       COUNT(*) FILTER (WHERE l.statut = 'PERDU') AS perdu
FROM public.agence a
LEFT JOIN public.livret l ON l.id_agence = a.id_agence
GROUP BY a.id_agence, a.code, a.nom;

GRANT SELECT ON public.v_solde_livret, public.v_situation_individuelle, public.v_stock_agence TO authenticated;

-- ============ AUDIT ============
CREATE OR REPLACE FUNCTION public.journaliser()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id text;
BEGIN
  _id := COALESCE((to_jsonb(NEW) ->> (TG_ARGV[0])), (to_jsonb(OLD) ->> (TG_ARGV[0])));
  INSERT INTO public.audit (id_utilisateur, auth_user_id, action, table_cible, id_cible, ancienne_valeur, nouvelle_valeur)
  VALUES (public.utilisateur_courant(), auth.uid(), TG_OP, TG_TABLE_NAME, _id,
          CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
          CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END);
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER trg_audit_operation AFTER INSERT OR UPDATE ON public.operation FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_operation');
CREATE TRIGGER trg_audit_livret AFTER INSERT OR UPDATE ON public.livret FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_livret');
CREATE TRIGGER trg_audit_epargnant AFTER INSERT OR UPDATE ON public.epargnant FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_epargnant');
CREATE TRIGGER trg_audit_regle AFTER INSERT OR UPDATE ON public.regle_commission FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_regle');
CREATE TRIGGER trg_audit_utilisateur AFTER INSERT OR UPDATE ON public.utilisateur FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_utilisateur');
CREATE TRIGGER trg_audit_ur AFTER INSERT OR DELETE ON public.utilisateur_role FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_utilisateur');
CREATE TRIGGER trg_audit_remise AFTER INSERT OR UPDATE ON public.remise_caisse FOR EACH ROW EXECUTE FUNCTION public.journaliser('id_remise');
CREATE TRIGGER trg_audit_parametre AFTER UPDATE ON public.parametre FOR EACH ROW EXECUTE FUNCTION public.journaliser('cle');

-- Interdiction de modifier une opération validée (hors annulation contrôlée)
CREATE OR REPLACE FUNCTION public.protege_operation()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.statut = 'VALIDEE' AND NEW.statut NOT IN ('VALIDEE','ANNULEE','REVERSEE') THEN
    RAISE EXCEPTION 'Une opération validée ne peut pas être modifiée';
  END IF;
  IF OLD.statut = 'VALIDEE' AND (NEW.montant <> OLD.montant OR NEW.id_livret IS DISTINCT FROM OLD.id_livret) THEN
    RAISE EXCEPTION 'Le montant d''une opération validée ne peut pas être modifié';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_protege_operation BEFORE UPDATE ON public.operation FOR EACH ROW EXECUTE FUNCTION public.protege_operation();

CREATE OR REPLACE FUNCTION public.interdit_suppression()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Suppression physique interdite sur %', TG_TABLE_NAME; END; $$;
CREATE TRIGGER trg_no_delete_operation BEFORE DELETE ON public.operation FOR EACH ROW EXECUTE FUNCTION public.interdit_suppression();
CREATE TRIGGER trg_no_delete_livret BEFORE DELETE ON public.livret FOR EACH ROW EXECUTE FUNCTION public.interdit_suppression();
CREATE TRIGGER trg_no_delete_epargnant BEFORE DELETE ON public.epargnant FOR EACH ROW EXECUTE FUNCTION public.interdit_suppression();

-- ============ RATTACHEMENT AUTH ============
CREATE OR REPLACE FUNCTION public.rattacher_utilisateur()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.utilisateur SET auth_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email) AND auth_user_id IS NULL;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_rattacher_utilisateur AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.rattacher_utilisateur();

-- ============ COMMISSION ============
CREATE OR REPLACE FUNCTION public.calculer_commission(_code_type text, _base numeric, _date date)
RETURNS TABLE (id_regle uuid, montant numeric) LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT r.id_regle,
         CASE r.mode_calcul
           WHEN 'FIXE' THEN COALESCE(r.montant_fixe, 0)
           WHEN 'TAUX' THEN ROUND(_base * COALESCE(r.taux, 0), 2)
           WHEN 'PALIER' THEN COALESCE(r.montant_fixe, ROUND(_base * COALESCE(r.taux, 0), 2))
           ELSE 0
         END::numeric
  FROM public.regle_commission r
  WHERE r.actif AND r.mode_calcul <> 'A_DEFINIR'
    AND r.code_type_declencheur = _code_type
    AND r.date_debut <= _date AND (r.date_fin IS NULL OR r.date_fin >= _date)
    AND (r.seuil_min IS NULL OR _base >= r.seuil_min)
    AND (r.seuil_max IS NULL OR _base <= r.seuil_max)
  ORDER BY r.date_debut DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.enregistrer_commission(_code_type text, _base numeric, _date date,
  _id_livret uuid, _id_operation uuid, _id_agence uuid, _id_utilisateur uuid)
RETURNS uuid LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _r record; _id uuid; _periode uuid;
BEGIN
  SELECT * INTO _r FROM public.calculer_commission(_code_type, _base, _date);
  IF _r.id_regle IS NULL OR COALESCE(_r.montant,0) <= 0 THEN RETURN NULL; END IF;
  SELECT p.id_periode INTO _periode FROM public.periode_commission p
    WHERE p.annee = EXTRACT(YEAR FROM _date)::int AND p.mois = EXTRACT(MONTH FROM _date)::int;
  IF _periode IS NULL THEN
    INSERT INTO public.periode_commission (annee, mois, date_debut, date_fin)
    VALUES (EXTRACT(YEAR FROM _date)::int, EXTRACT(MONTH FROM _date)::int,
            date_trunc('month', _date)::date, (date_trunc('month', _date) + interval '1 month - 1 day')::date)
    RETURNING id_periode INTO _periode;
  END IF;
  INSERT INTO public.commission (reference, id_livret, id_regle, id_periode, id_operation_origine,
    id_utilisateur, id_agence, base_calcul, montant)
  VALUES (public.generer_reference('CM-', 'public.seq_reference_commission'::regclass), _id_livret, _r.id_regle,
    _periode, _id_operation, _id_utilisateur, _id_agence, _base, _r.montant)
  RETURNING id_commission INTO _id;
  RETURN _id;
END; $$;

-- ============ VENTE DE LIVRET ============
CREATE OR REPLACE FUNCTION public.enregistrer_vente(_id_livret uuid, _id_epargnant uuid, _montant numeric, _date date DEFAULT current_date, _commentaire text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _l record; _e record; _ref text; _op uuid;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF _montant IS NULL OR _montant <= 0 THEN RAISE EXCEPTION 'Le montant doit être strictement positif'; END IF;

  SELECT * INTO _l FROM public.livret WHERE id_livret = _id_livret FOR UPDATE;
  IF _l IS NULL THEN RAISE EXCEPTION 'Livret introuvable'; END IF;
  IF _l.statut <> 'EN_STOCK' THEN RAISE EXCEPTION 'Ce livret est déjà attribué (statut %)', _l.statut; END IF;
  IF NOT public.acces_agence(_l.id_agence) THEN RAISE EXCEPTION 'Accès refusé à cette agence'; END IF;
  IF NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE') OR public.a_role('COLLECTRICE')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas d''enregistrer une vente';
  END IF;

  SELECT * INTO _e FROM public.epargnant WHERE id_epargnant = _id_epargnant;
  IF _e IS NULL THEN RAISE EXCEPTION 'Épargnant introuvable'; END IF;
  IF _e.id_agence <> _l.id_agence THEN RAISE EXCEPTION 'L''épargnant et le livret ne sont pas de la même agence'; END IF;

  UPDATE public.livret SET id_epargnant = _id_epargnant, statut = 'ACTIF',
    id_collectrice = COALESCE(id_collectrice, _u), date_attribution = _date, date_activation = _date
  WHERE id_livret = _id_livret;

  INSERT INTO public.mouvement_livret (id_livret, type_mouvement, statut_avant, statut_apres, id_utilisateur, id_agence, commentaire)
  VALUES (_id_livret, 'ATTRIBUTION', _l.statut, 'ACTIF', _u, _l.id_agence, _commentaire),
         (_id_livret, 'ACTIVATION', 'ATTRIBUE', 'ACTIF', _u, _l.id_agence, NULL);

  _ref := public.generer_reference('OP-', 'public.seq_reference_operation'::regclass);
  INSERT INTO public.operation (reference, id_livret, id_epargnant, id_agence, code_type, id_utilisateur,
    date_operation, date_valeur, montant, statut, commentaire, date_validation, id_valideur)
  VALUES (_ref, _id_livret, _id_epargnant, _l.id_agence, 'ACHAT_CARNET', _u, _date, _date, _montant, 'VALIDEE', _commentaire, now(), _u)
  RETURNING id_operation INTO _op;

  PERFORM public.enregistrer_commission('ACHAT_CARNET', _montant, _date, _id_livret, _op, _l.id_agence, _u);
  RETURN _op;
END; $$;

-- ============ COLLECTE ============
CREATE OR REPLACE FUNCTION public.enregistrer_collecte(_id_livret uuid, _montant numeric, _date date DEFAULT current_date, _commentaire text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _l record; _ref text; _op uuid;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF _montant IS NULL OR _montant <= 0 THEN RAISE EXCEPTION 'Le montant doit être strictement positif'; END IF;
  IF _date > current_date THEN RAISE EXCEPTION 'La date de collecte ne peut pas être future'; END IF;

  SELECT * INTO _l FROM public.livret WHERE id_livret = _id_livret FOR UPDATE;
  IF _l IS NULL THEN RAISE EXCEPTION 'Livret introuvable'; END IF;
  IF _l.statut <> 'ACTIF' THEN RAISE EXCEPTION 'Le livret n''est pas actif (statut %)', _l.statut; END IF;
  IF NOT public.acces_agence(_l.id_agence) THEN RAISE EXCEPTION 'Accès refusé à cette agence'; END IF;
  IF public.a_role('COLLECTRICE') AND NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE'))
     AND _l.id_collectrice IS DISTINCT FROM _u THEN
    RAISE EXCEPTION 'Ce livret n''est pas rattaché à votre portefeuille';
  END IF;

  _ref := public.generer_reference('OP-', 'public.seq_reference_operation'::regclass);
  INSERT INTO public.operation (reference, id_livret, id_epargnant, id_agence, code_type, id_utilisateur,
    date_operation, date_valeur, montant, statut, commentaire, date_validation, id_valideur)
  VALUES (_ref, _id_livret, _l.id_epargnant, _l.id_agence, 'COLLECTE', _u, _date, _date, _montant, 'VALIDEE', _commentaire, now(), _u)
  RETURNING id_operation INTO _op;
  RETURN _op;
END; $$;

-- ============ RETRAIT ============
CREATE OR REPLACE FUNCTION public.enregistrer_retrait(_id_livret uuid, _montant numeric, _date date DEFAULT current_date, _commentaire text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _l record; _solde numeric; _min numeric; _max numeric; _neg boolean; _valid boolean; _ref text; _op uuid; _statut text;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('CAISSIER') OR public.a_role('RESPONSABLE_AGENCE')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas d''enregistrer un retrait';
  END IF;
  IF _montant IS NULL OR _montant <= 0 THEN RAISE EXCEPTION 'Le montant doit être strictement positif'; END IF;

  SELECT * INTO _l FROM public.livret WHERE id_livret = _id_livret FOR UPDATE;
  IF _l IS NULL THEN RAISE EXCEPTION 'Livret introuvable'; END IF;
  IF _l.statut NOT IN ('ACTIF') THEN RAISE EXCEPTION 'Le livret n''est pas actif (statut %)', _l.statut; END IF;
  IF NOT public.acces_agence(_l.id_agence) THEN RAISE EXCEPTION 'Accès refusé à cette agence'; END IF;

  SELECT solde INTO _solde FROM public.v_solde_livret WHERE id_livret = _id_livret;
  SELECT (valeur)::numeric INTO _min FROM public.parametre WHERE cle = 'retrait_montant_min' AND valeur IS NOT NULL;
  SELECT (valeur)::numeric INTO _max FROM public.parametre WHERE cle = 'retrait_montant_max' AND valeur IS NOT NULL;
  SELECT (valeur = 'true') INTO _neg FROM public.parametre WHERE cle = 'retrait_solde_negatif_autorise';
  SELECT (valeur = 'true') INTO _valid FROM public.parametre WHERE cle = 'retrait_validation_obligatoire';

  IF _min IS NOT NULL AND _montant < _min THEN RAISE EXCEPTION 'Montant inférieur au minimum autorisé (%)', _min; END IF;
  IF _max IS NOT NULL AND _montant > _max THEN RAISE EXCEPTION 'Montant supérieur au maximum autorisé (%)', _max; END IF;
  IF COALESCE(_neg, false) = false AND _montant > COALESCE(_solde, 0) THEN
    RAISE EXCEPTION 'Solde insuffisant : solde disponible %', COALESCE(_solde, 0);
  END IF;

  _statut := CASE WHEN COALESCE(_valid, true) AND NOT public.a_role('CAISSIER') THEN 'EN_ATTENTE' ELSE 'VALIDEE' END;
  _ref := public.generer_reference('OP-', 'public.seq_reference_operation'::regclass);
  INSERT INTO public.operation (reference, id_livret, id_epargnant, id_agence, code_type, id_utilisateur,
    date_operation, date_valeur, montant, statut, commentaire, date_validation, id_valideur)
  VALUES (_ref, _id_livret, _l.id_epargnant, _l.id_agence, 'RETRAIT', _u, _date, _date, _montant, _statut, _commentaire,
    CASE WHEN _statut = 'VALIDEE' THEN now() END, CASE WHEN _statut = 'VALIDEE' THEN _u END)
  RETURNING id_operation INTO _op;

  IF _statut = 'VALIDEE' THEN
    PERFORM public.enregistrer_commission('RETRAIT', _montant, _date, _id_livret, _op, _l.id_agence, _u);
  END IF;
  RETURN _op;
END; $$;

-- ============ VALIDATION / ANNULATION ============
CREATE OR REPLACE FUNCTION public.valider_operation(_id_operation uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _o record;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('DIRECTION') OR public.a_role('CAISSIER')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas de valider une opération';
  END IF;
  SELECT * INTO _o FROM public.operation WHERE id_operation = _id_operation FOR UPDATE;
  IF _o IS NULL THEN RAISE EXCEPTION 'Opération introuvable'; END IF;
  IF NOT public.acces_agence(_o.id_agence) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF _o.statut = 'VALIDEE' THEN RAISE EXCEPTION 'Opération déjà validée'; END IF;
  IF _o.statut NOT IN ('BROUILLON','EN_ATTENTE') THEN RAISE EXCEPTION 'Opération non validable (statut %)', _o.statut; END IF;
  UPDATE public.operation SET statut = 'VALIDEE', date_validation = now(), id_valideur = _u WHERE id_operation = _id_operation;
  PERFORM public.enregistrer_commission(_o.code_type, _o.montant, _o.date_operation, _o.id_livret, _o.id_operation, _o.id_agence, _o.id_utilisateur);
  RETURN _id_operation;
END; $$;

CREATE OR REPLACE FUNCTION public.annuler_operation(_id_operation uuid, _motif text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _o record; _t record; _ref text; _new uuid;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('DIRECTION') OR public.a_role('RESPONSABLE_AGENCE')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas d''annuler une opération';
  END IF;
  IF _motif IS NULL OR length(trim(_motif)) = 0 THEN RAISE EXCEPTION 'Le motif d''annulation est obligatoire'; END IF;
  SELECT * INTO _o FROM public.operation WHERE id_operation = _id_operation FOR UPDATE;
  IF _o IS NULL THEN RAISE EXCEPTION 'Opération introuvable'; END IF;
  IF NOT public.acces_agence(_o.id_agence) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF _o.statut IN ('ANNULEE','REVERSEE') THEN RAISE EXCEPTION 'Opération déjà annulée'; END IF;

  IF _o.statut = 'VALIDEE' THEN
    SELECT * INTO _t FROM public.type_operation WHERE code_type = _o.code_type;
    _ref := public.generer_reference('OP-', 'public.seq_reference_operation'::regclass);
    INSERT INTO public.operation (reference, id_livret, id_epargnant, id_agence, code_type, id_utilisateur,
      date_operation, date_valeur, montant, statut, commentaire, id_operation_origine, date_validation, id_valideur)
    VALUES (_ref, _o.id_livret, _o.id_epargnant, _o.id_agence,
      CASE WHEN _t.sens = 'CREDIT' THEN 'RETRAIT' ELSE 'AJUSTEMENT' END,
      _u, current_date, current_date, _o.montant, 'VALIDEE',
      'Contre-passation de ' || _o.reference || ' — ' || _motif, _o.id_operation, now(), _u)
    RETURNING id_operation INTO _new;
    UPDATE public.operation SET statut = 'REVERSEE', commentaire = COALESCE(commentaire,'') || ' [Annulée: ' || _motif || ']'
      WHERE id_operation = _id_operation;
    UPDATE public.commission SET statut = 'ANNULEE' WHERE id_operation_origine = _id_operation;
    RETURN _new;
  ELSE
    UPDATE public.operation SET statut = 'ANNULEE', commentaire = COALESCE(commentaire,'') || ' [Annulée: ' || _motif || ']'
      WHERE id_operation = _id_operation;
    RETURN _id_operation;
  END IF;
END; $$;

-- ============ STOCK / RECEPTION DE LIVRETS ============
CREATE OR REPLACE FUNCTION public.receptionner_livrets(_id_agence uuid, _numeros text[])
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _n text; _id uuid; _c int := 0;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas de réceptionner du stock';
  END IF;
  IF NOT public.acces_agence(_id_agence) THEN RAISE EXCEPTION 'Accès refusé à cette agence'; END IF;
  FOREACH _n IN ARRAY _numeros LOOP
    IF length(trim(_n)) > 0 THEN
      IF EXISTS (SELECT 1 FROM public.livret WHERE numero_livret = trim(_n)) THEN
        RAISE EXCEPTION 'Le livret % existe déjà', trim(_n);
      END IF;
      INSERT INTO public.livret (numero_livret, id_agence) VALUES (trim(_n), _id_agence) RETURNING id_livret INTO _id;
      INSERT INTO public.mouvement_livret (id_livret, type_mouvement, statut_apres, id_utilisateur, id_agence)
      VALUES (_id, 'RECEPTION', 'EN_STOCK', _u, _id_agence);
      _c := _c + 1;
    END IF;
  END LOOP;
  RETURN _c;
END; $$;

CREATE OR REPLACE FUNCTION public.changer_statut_livret(_id_livret uuid, _statut text, _motif text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _l record; _type text;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')) THEN RAISE EXCEPTION 'Action non autorisée'; END IF;
  SELECT * INTO _l FROM public.livret WHERE id_livret = _id_livret FOR UPDATE;
  IF _l IS NULL THEN RAISE EXCEPTION 'Livret introuvable'; END IF;
  IF NOT public.acces_agence(_l.id_agence) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF _statut NOT IN ('BLOQUE','ACTIF','CLOTURE','PERDU') THEN RAISE EXCEPTION 'Statut non autorisé'; END IF;
  _type := CASE _statut WHEN 'BLOQUE' THEN 'BLOCAGE' WHEN 'ACTIF' THEN 'DEBLOCAGE' WHEN 'CLOTURE' THEN 'CLOTURE' ELSE 'PERTE' END;
  UPDATE public.livret SET statut = _statut, date_cloture = CASE WHEN _statut = 'CLOTURE' THEN current_date ELSE date_cloture END
    WHERE id_livret = _id_livret;
  INSERT INTO public.mouvement_livret (id_livret, type_mouvement, statut_avant, statut_apres, id_utilisateur, id_agence, commentaire)
  VALUES (_id_livret, _type, _l.statut, _statut, _u, _l.id_agence, _motif);
  RETURN _id_livret;
END; $$;

-- ============ CAISSE ============
CREATE OR REPLACE FUNCTION public.creer_remise(_date date, _montant_declare numeric, _commentaire text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _ag uuid; _remise uuid; _attendu numeric;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  _ag := public.agence_courante();
  IF _ag IS NULL THEN RAISE EXCEPTION 'Aucune agence rattachée à votre compte'; END IF;

  SELECT COALESCE(SUM(o.montant), 0) INTO _attendu FROM public.operation o
   WHERE o.id_utilisateur = _u AND o.date_operation = _date AND o.statut = 'VALIDEE'
     AND o.code_type IN ('COLLECTE','ACHAT_CARNET')
     AND NOT EXISTS (SELECT 1 FROM public.detail_remise d WHERE d.id_operation = o.id_operation);

  INSERT INTO public.remise_caisse (reference, id_agence, id_utilisateur, date_remise, montant_attendu, montant_declare, commentaire)
  VALUES (public.generer_reference('RM-', 'public.seq_reference_remise'::regclass), _ag, _u, _date, _attendu, _montant_declare, _commentaire)
  RETURNING id_remise INTO _remise;

  INSERT INTO public.detail_remise (id_remise, id_operation, montant)
  SELECT _remise, o.id_operation, o.montant FROM public.operation o
   WHERE o.id_utilisateur = _u AND o.date_operation = _date AND o.statut = 'VALIDEE'
     AND o.code_type IN ('COLLECTE','ACHAT_CARNET')
     AND NOT EXISTS (SELECT 1 FROM public.detail_remise d WHERE d.id_operation = o.id_operation);
  RETURN _remise;
END; $$;

CREATE OR REPLACE FUNCTION public.controler_remise(_id_remise uuid, _montant_controle numeric, _valider boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid; _r record;
BEGIN
  _u := public.utilisateur_courant();
  IF NOT (public.est_admin() OR public.a_role('CAISSIER')) THEN RAISE EXCEPTION 'Seul un caissier peut contrôler une remise'; END IF;
  SELECT * INTO _r FROM public.remise_caisse WHERE id_remise = _id_remise FOR UPDATE;
  IF _r IS NULL THEN RAISE EXCEPTION 'Remise introuvable'; END IF;
  IF NOT public.acces_agence(_r.id_agence) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF _r.statut = 'VALIDEE' THEN RAISE EXCEPTION 'Remise déjà validée'; END IF;
  UPDATE public.remise_caisse SET montant_controle = _montant_controle, id_caissier = _u,
    statut = CASE WHEN _valider THEN 'VALIDEE' ELSE 'CONTROLEE' END,
    date_validation = CASE WHEN _valider THEN now() END
  WHERE id_remise = _id_remise;
  RETURN _id_remise;
END; $$;

-- ============ EPARGNANT ============
CREATE OR REPLACE FUNCTION public.prochain_numero_client()
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT 'CL-' || lpad(nextval('public.seq_numero_client')::text, 6, '0');
$$;

REVOKE EXECUTE ON FUNCTION public.utilisateur_courant, public.agence_courante, public.a_role(text),
  public.est_admin, public.voit_tout, public.acces_agence(uuid), public.journaliser,
  public.rattacher_utilisateur, public.enregistrer_commission(text, numeric, date, uuid, uuid, uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.enregistrer_vente(uuid, uuid, numeric, date, text),
  public.enregistrer_collecte(uuid, numeric, date, text), public.enregistrer_retrait(uuid, numeric, date, text),
  public.valider_operation(uuid), public.annuler_operation(uuid, text),
  public.receptionner_livrets(uuid, text[]), public.changer_statut_livret(uuid, text, text),
  public.creer_remise(date, numeric, text), public.controler_remise(uuid, numeric, boolean),
  public.prochain_numero_client() FROM anon;