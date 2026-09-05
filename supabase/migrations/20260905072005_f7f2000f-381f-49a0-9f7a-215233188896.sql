CREATE OR REPLACE FUNCTION public.enregistrer_vente(_id_livret uuid, _id_epargnant uuid, _montant numeric, _date date DEFAULT CURRENT_DATE, _commentaire text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _u uuid; _l record; _e record; _ref text; _op uuid;
BEGIN
  _u := public.utilisateur_courant();
  IF _u IS NULL THEN RAISE EXCEPTION 'Utilisateur non autorisé'; END IF;
  IF _montant IS NULL OR _montant <= 0 THEN RAISE EXCEPTION 'Le montant doit être strictement positif'; END IF;

  SELECT * INTO _l FROM public.livret WHERE id_livret = _id_livret FOR UPDATE;
  IF _l IS NULL THEN RAISE EXCEPTION 'Livret introuvable'; END IF;
  IF _l.statut <> 'EN_STOCK' THEN RAISE EXCEPTION 'Ce livret est déjà attribué (statut %)', _l.statut; END IF;
  IF NOT public.acces_agence(_l.id_agence) THEN RAISE EXCEPTION 'Accès refusé à cette agence'; END IF;
  IF NOT (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE') OR public.a_role('COLLECTRICE') OR public.a_role('CAISSIER')) THEN
    RAISE EXCEPTION 'Votre rôle ne permet pas d''enregistrer une vente';
  END IF;

  SELECT * INTO _e FROM public.epargnant WHERE id_epargnant = _id_epargnant;
  IF _e IS NULL THEN RAISE EXCEPTION 'Épargnant introuvable'; END IF;
  IF _e.id_agence <> _l.id_agence THEN RAISE EXCEPTION 'L''épargnant et le livret ne sont pas de la même agence'; END IF;

  UPDATE public.livret SET id_epargnant = _id_epargnant, statut = 'ACTIF',
    id_collectrice = COALESCE(id_collectrice, CASE WHEN public.a_role('COLLECTRICE') THEN _u END),
    date_attribution = _date, date_activation = _date
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
END; $function$;

CREATE OR REPLACE FUNCTION public.controler_remise(_id_remise uuid, _montant_controle numeric, _valider boolean DEFAULT false, _commentaire text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _u uuid; _r record;
BEGIN
  _u := public.utilisateur_courant();
  IF NOT (public.est_admin() OR public.a_role('CAISSIER')) THEN RAISE EXCEPTION 'Seul un caissier peut contrôler une remise'; END IF;
  SELECT * INTO _r FROM public.remise_caisse WHERE id_remise = _id_remise FOR UPDATE;
  IF _r IS NULL THEN RAISE EXCEPTION 'Remise introuvable'; END IF;
  IF NOT public.acces_agence(_r.id_agence) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  IF _r.statut = 'VALIDEE' THEN RAISE EXCEPTION 'Remise déjà validée'; END IF;
  UPDATE public.remise_caisse
  SET montant_controle = _montant_controle,
      id_caissier = _u,
      ecart = COALESCE(_montant_controle, 0) - _r.montant_attendu,
      commentaire = COALESCE(_commentaire, commentaire),
      statut = CASE WHEN _valider THEN 'VALIDEE' ELSE 'CONTROLEE' END,
      date_validation = CASE WHEN _valider THEN now() END
  WHERE id_remise = _id_remise;
  RETURN _id_remise;
END; $function$;