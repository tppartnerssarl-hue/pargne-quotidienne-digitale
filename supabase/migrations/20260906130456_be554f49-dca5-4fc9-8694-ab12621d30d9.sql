CREATE TABLE public.zone (
  id_zone uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  code text NOT NULL,
  libelle text NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id_agence, code)
);
GRANT SELECT, INSERT, UPDATE ON public.zone TO authenticated;
GRANT ALL ON public.zone TO service_role;
ALTER TABLE public.zone ENABLE ROW LEVEL SECURITY;
CREATE POLICY zone_lecture ON public.zone FOR SELECT TO authenticated USING (public.acces_agence(id_agence));
CREATE POLICY zone_gestion ON public.zone FOR INSERT TO authenticated WITH CHECK (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')));
CREATE POLICY zone_maj ON public.zone FOR UPDATE TO authenticated USING (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE'))) WITH CHECK (public.acces_agence(id_agence));
CREATE TRIGGER zone_interdit_suppression BEFORE DELETE ON public.zone FOR EACH ROW EXECUTE FUNCTION public.interdit_suppression();
CREATE TRIGGER zone_updated_at BEFORE UPDATE ON public.zone FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.epargnant ADD COLUMN id_zone uuid REFERENCES public.zone(id_zone);
CREATE INDEX idx_epargnant_zone ON public.epargnant(id_zone);

CREATE TABLE public.planning_collecte (
  id_planning uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  id_collectrice uuid NOT NULL REFERENCES public.utilisateur(id_utilisateur),
  id_zone uuid REFERENCES public.zone(id_zone),
  id_epargnant uuid REFERENCES public.epargnant(id_epargnant),
  jour_semaine integer NOT NULL,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT planning_cible CHECK ((id_zone IS NOT NULL)::int + (id_epargnant IS NOT NULL)::int = 1),
  CONSTRAINT planning_jour CHECK (jour_semaine BETWEEN 1 AND 7)
);
GRANT SELECT, INSERT, UPDATE ON public.planning_collecte TO authenticated;
GRANT ALL ON public.planning_collecte TO service_role;
ALTER TABLE public.planning_collecte ENABLE ROW LEVEL SECURITY;
CREATE POLICY planning_lecture ON public.planning_collecte FOR SELECT TO authenticated USING (public.acces_agence(id_agence));
CREATE POLICY planning_gestion ON public.planning_collecte FOR INSERT TO authenticated WITH CHECK (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')));
CREATE POLICY planning_maj ON public.planning_collecte FOR UPDATE TO authenticated USING (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE'))) WITH CHECK (public.acces_agence(id_agence));
CREATE TRIGGER planning_interdit_suppression BEFORE DELETE ON public.planning_collecte FOR EACH ROW EXECUTE FUNCTION public.interdit_suppression();
CREATE TRIGGER planning_updated_at BEFORE UPDATE ON public.planning_collecte FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.epargnants_sans_collecte(_jours integer DEFAULT 3)
RETURNS TABLE(id_epargnant uuid, numero_client text, nom text, prenom text, telephone text, derniere_collecte date, jours_sans_collecte integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.id_epargnant, e.numero_client, e.nom, e.prenom, e.telephone,
         MAX(o.date_operation) AS derniere_collecte,
         (CURRENT_DATE - MAX(o.date_operation))::integer AS jours_sans_collecte
  FROM public.epargnant e
  JOIN public.livret l ON l.id_epargnant = e.id_epargnant AND l.statut = 'ACTIF'
  LEFT JOIN public.operation o ON o.id_livret = l.id_livret AND o.code_type = 'COLLECTE' AND o.statut = 'VALIDEE'
  WHERE e.statut = 'ACTIF' AND public.acces_agence(e.id_agence)
  GROUP BY e.id_epargnant, e.numero_client, e.nom, e.prenom, e.telephone
  HAVING MAX(o.date_operation) IS NULL OR MAX(o.date_operation) <= CURRENT_DATE - _jours
  ORDER BY jours_sans_collecte DESC NULLS FIRST;
$$;
REVOKE EXECUTE ON FUNCTION public.epargnants_sans_collecte(integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.epargnants_sans_collecte(integer) TO authenticated;