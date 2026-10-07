DROP POLICY IF EXISTS p_role_read ON public.role;
CREATE POLICY p_role_read ON public.role FOR SELECT TO authenticated USING (public.utilisateur_courant() IS NOT NULL);
DROP POLICY IF EXISTS p_type_op_read ON public.type_operation;
CREATE POLICY p_type_op_read ON public.type_operation FOR SELECT TO authenticated USING (public.utilisateur_courant() IS NOT NULL);
DROP POLICY IF EXISTS p_param_read ON public.parametre;
CREATE POLICY p_param_read ON public.parametre FOR SELECT TO authenticated USING (public.utilisateur_courant() IS NOT NULL);
DROP POLICY IF EXISTS p_regle_read ON public.regle_commission;
CREATE POLICY p_regle_read ON public.regle_commission FOR SELECT TO authenticated USING (public.utilisateur_courant() IS NOT NULL);
DROP POLICY IF EXISTS p_periode_read ON public.periode_commission;
CREATE POLICY p_periode_read ON public.periode_commission FOR SELECT TO authenticated USING (public.utilisateur_courant() IS NOT NULL);
DROP POLICY IF EXISTS p_audit_ins ON public.audit;
CREATE POLICY p_audit_ins ON public.audit FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());
DROP POLICY IF EXISTS p_commission_upd ON public.commission;
CREATE POLICY p_commission_upd ON public.commission FOR UPDATE TO authenticated
  USING (public.est_admin() OR public.a_role('DIRECTION'))
  WITH CHECK (public.est_admin() OR public.a_role('DIRECTION'));