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
         COALESCE((SELECT SUM(r.total) FROM realise r
                    WHERE r.code_type = ob.code_type
                      AND (ob.id_collectrice IS NULL OR r.id_utilisateur = ob.id_collectrice)), 0) AS montant_realise,
         ROUND(COALESCE((SELECT SUM(r.total) FROM realise r
                    WHERE r.code_type = ob.code_type
                      AND (ob.id_collectrice IS NULL OR r.id_utilisateur = ob.id_collectrice)), 0) * 100.0 / ob.montant_cible, 1) AS taux_atteinte
  FROM public.objectif ob
  LEFT JOIN public.utilisateur u ON u.id_utilisateur = ob.id_collectrice
  WHERE ob.actif AND ob.annee = _annee AND ob.mois = _mois
    AND public.acces_agence(ob.id_agence)
  ORDER BY collectrice, ob.code_type;
$$;
REVOKE EXECUTE ON FUNCTION public.suivi_objectifs(integer, integer) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.suivi_objectifs(integer, integer) TO authenticated;