CREATE TABLE public.objectif (
  id_objectif uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  id_collectrice uuid REFERENCES public.utilisateur(id_utilisateur),
  code_type text NOT NULL REFERENCES public.type_operation(code_type),
  annee integer NOT NULL,
  mois integer NOT NULL,
  montant_cible numeric NOT NULL CHECK (montant_cible > 0),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT objectif_mois CHECK (mois BETWEEN 1 AND 12),
  CONSTRAINT objectif_type CHECK (code_type IN ('COLLECTE', 'ACHAT_CARNET')),
  UNIQUE (id_agence, id_collectrice, code_type, annee, mois)
);
GRANT SELECT, INSERT, UPDATE ON public.objectif TO authenticated;
GRANT ALL ON public.objectif TO service_role;
ALTER TABLE public.objectif ENABLE ROW LEVEL SECURITY;
CREATE POLICY objectif_lecture ON public.objectif FOR SELECT TO authenticated USING (public.acces_agence(id_agence));
CREATE POLICY objectif_gestion ON public.objectif FOR INSERT TO authenticated WITH CHECK (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('DIRECTION') OR public.a_role('RESPONSABLE_AGENCE')));
CREATE POLICY objectif_maj ON public.objectif FOR UPDATE TO authenticated USING (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('DIRECTION') OR public.a_role('RESPONSABLE_AGENCE'))) WITH CHECK (public.acces_agence(id_agence));
CREATE TRIGGER objectif_interdit_suppression BEFORE DELETE ON public.objectif FOR EACH ROW EXECUTE FUNCTION public.interdit_suppression();
CREATE TRIGGER objectif_updated_at BEFORE UPDATE ON public.objectif FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.suivi_objectifs(_annee integer, _mois integer)
RETURNS TABLE(id_collectrice uuid, collectrice text, code_type text, montant_cible numeric, montant_realise numeric, taux_atteinte numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH periode AS (
    SELECT make_date(_annee, _mois, 1) AS debut, (make_date(_annee, _mois, 1) + interval '1 month - 1 day')::date AS fin
  ),
  realise AS (
    SELECT o.id_utilisateur, o.code_type, SUM(o.montant) AS total
    FROM public.operation o, periode p
    WHERE o.statut = 'VALIDEE' AND o.code_type IN ('COLLECTE', 'ACHAT_CARNET')
      AND o.date_operation BETWEEN p.debut AND p.fin
      AND public.acces_agence(o.id_agence)
    GROUP BY o.id_utilisateur, o.code_type
  )
  SELECT ob.id_collectrice,
         COALESCE(u.prenom || ' ' || u.nom, 'Agence entière') AS collectrice,
         ob.code_type,
         ob.montant_cible,
         COALESCE(r.total, 0) AS montant_realise,
         ROUND(COALESCE(r.total, 0) * 100.0 / ob.montant_cible, 1) AS taux_atteinte
  FROM public.objectif ob
  LEFT JOIN public.utilisateur u ON u.id_utilisateur = ob.id_collectrice
  LEFT JOIN realise r ON r.code_type = ob.code_type
         AND (r.id_utilisateur = ob.id_collectrice OR ob.id_collectrice IS NULL)
  WHERE ob.actif AND ob.annee = _annee AND ob.mois = _mois
    AND public.acces_agence(ob.id_agence)
  ORDER BY collectrice, ob.code_type;
$$;
REVOKE EXECUTE ON FUNCTION public.suivi_objectifs(integer, integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.suivi_objectifs(integer, integer) TO authenticated;