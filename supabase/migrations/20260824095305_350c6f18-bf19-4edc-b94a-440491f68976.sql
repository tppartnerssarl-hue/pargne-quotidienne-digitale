-- 1) Fonctions internes : aucun appel direct depuis l'API
REVOKE EXECUTE ON FUNCTION public.journaliser() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.interdit_suppression() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protege_operation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rattacher_utilisateur() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generer_reference(text, regclass) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculer_commission(text, numeric, date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enregistrer_commission(text, numeric, date, uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prochain_numero_client() FROM PUBLIC, anon;

-- 2) Fonctions métier et helpers : connectés uniquement
REVOKE EXECUTE ON FUNCTION public.a_role(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.acces_agence(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.agence_courante() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.est_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.voit_tout() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.utilisateur_courant() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.annuler_operation(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.changer_statut_livret(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.controler_remise(uuid, numeric, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.creer_remise(date, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enregistrer_collecte(uuid, numeric, date, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enregistrer_retrait(uuid, numeric, date, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enregistrer_vente(uuid, uuid, numeric, date, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.receptionner_livrets(uuid, text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.valider_operation(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.a_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.acces_agence(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.agence_courante() TO authenticated;
GRANT EXECUTE ON FUNCTION public.est_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.voit_tout() TO authenticated;
GRANT EXECUTE ON FUNCTION public.utilisateur_courant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.annuler_operation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.changer_statut_livret(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.controler_remise(uuid, numeric, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.creer_remise(date, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enregistrer_collecte(uuid, numeric, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enregistrer_retrait(uuid, numeric, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enregistrer_vente(uuid, uuid, numeric, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.receptionner_livrets(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.valider_operation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.prochain_numero_client() TO authenticated;