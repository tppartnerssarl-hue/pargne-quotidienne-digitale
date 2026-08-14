-- Marquage données de test
ALTER TABLE public.agence ADD COLUMN est_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.epargnant ADD COLUMN est_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.utilisateur ADD COLUMN est_demo boolean NOT NULL DEFAULT false;

-- Premier utilisateur = administrateur
CREATE OR REPLACE FUNCTION public.rattacher_utilisateur()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _ag uuid; _role uuid;
BEGIN
  UPDATE public.utilisateur SET auth_user_id = NEW.id
  WHERE lower(email) = lower(NEW.email) AND auth_user_id IS NULL
  RETURNING id_utilisateur INTO _id;

  IF _id IS NULL THEN
    -- Aucun profil pré-créé : le tout premier compte devient administrateur
    IF NOT EXISTS (SELECT 1 FROM public.utilisateur WHERE auth_user_id IS NOT NULL) THEN
      SELECT id_agence INTO _ag FROM public.agence ORDER BY created_at LIMIT 1;
      INSERT INTO public.utilisateur (auth_user_id, id_agence, nom, prenom, email)
      VALUES (NEW.id, _ag,
        COALESCE(NEW.raw_user_meta_data ->> 'nom', 'Administrateur'),
        COALESCE(NEW.raw_user_meta_data ->> 'prenom', ''),
        NEW.email)
      RETURNING id_utilisateur INTO _id;
      SELECT id_role INTO _role FROM public.role WHERE code = 'ADMINISTRATEUR';
      INSERT INTO public.utilisateur_role (id_utilisateur, id_role) VALUES (_id, _role);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

-- ============ DONNEES DE DEMONSTRATION ============
INSERT INTO public.agence (id_agence, code, nom, adresse, telephone, est_demo) VALUES
  ('11111111-1111-1111-1111-111111111111','AG-DLA','Agence Douala Centre','Akwa, Douala','+237600000001', true),
  ('22222222-2222-2222-2222-222222222222','AG-YDE','Agence Yaoundé','Mvog-Mbi, Yaoundé','+237600000002', true);

INSERT INTO public.utilisateur (id_utilisateur, id_agence, nom, prenom, login, email, telephone, est_demo) VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','NGONO','Marie','m.ngono','demo.responsable@example.test','+237600000010', true),
  ('aaaaaaa1-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','ATANGANA','Claire','c.atangana','demo.collectrice1@example.test','+237600000011', true),
  ('aaaaaaa1-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','MBALLA','Sylvie','s.mballa','demo.collectrice2@example.test','+237600000012', true),
  ('aaaaaaa1-0000-4000-8000-000000000004','11111111-1111-1111-1111-111111111111','FOTSO','Jean','j.fotso','demo.caissier@example.test','+237600000013', true);

INSERT INTO public.utilisateur_role (id_utilisateur, id_role)
SELECT u.id_utilisateur, r.id_role FROM (VALUES
  ('aaaaaaa1-0000-4000-8000-000000000001'::uuid,'RESPONSABLE_AGENCE'),
  ('aaaaaaa1-0000-4000-8000-000000000002'::uuid,'COLLECTRICE'),
  ('aaaaaaa1-0000-4000-8000-000000000003'::uuid,'COLLECTRICE'),
  ('aaaaaaa1-0000-4000-8000-000000000004'::uuid,'CAISSIER')
) AS v(id, code)
JOIN public.utilisateur u ON u.id_utilisateur = v.id
JOIN public.role r ON r.code = v.code;

INSERT INTO public.epargnant (id_epargnant, numero_client, id_agence, nom, prenom, telephone, adresse, numero_cni, est_demo) VALUES
  ('bbbbbbb1-0000-4000-8000-000000000001','CL-DEMO01','11111111-1111-1111-1111-111111111111','TCHOUMI','Alice','+237690000001','Bonabéri','CNI-DEMO-01', true),
  ('bbbbbbb1-0000-4000-8000-000000000002','CL-DEMO02','11111111-1111-1111-1111-111111111111','KAMDEM','Paul','+237690000002','Deido','CNI-DEMO-02', true),
  ('bbbbbbb1-0000-4000-8000-000000000003','CL-DEMO03','11111111-1111-1111-1111-111111111111','NJOYA','Fatima','+237690000003','New Bell','CNI-DEMO-03', true),
  ('bbbbbbb1-0000-4000-8000-000000000004','CL-DEMO04','11111111-1111-1111-1111-111111111111','ESSOMBA','Georges','+237690000004','Bepanda','CNI-DEMO-04', true),
  ('bbbbbbb1-0000-4000-8000-000000000005','CL-DEMO05','11111111-1111-1111-1111-111111111111','MANGA','Rose','+237690000005','Bonapriso','CNI-DEMO-05', true),
  ('bbbbbbb1-0000-4000-8000-000000000006','CL-DEMO06','22222222-2222-2222-2222-222222222222','ONANA','Hervé','+237690000006','Nlongkak','CNI-DEMO-06', true);

INSERT INTO public.livret (id_livret, numero_livret, id_epargnant, id_agence, id_collectrice, statut, date_reception, date_attribution, date_activation) VALUES
  ('ccccccc1-0000-4000-8000-000000000001','LV-000001','bbbbbbb1-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-4000-8000-000000000002','ACTIF', current_date - 60, current_date - 60, current_date - 60),
  ('ccccccc1-0000-4000-8000-000000000002','LV-000002','bbbbbbb1-0000-4000-8000-000000000002','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-4000-8000-000000000002','ACTIF', current_date - 55, current_date - 50, current_date - 50),
  ('ccccccc1-0000-4000-8000-000000000003','LV-000003','bbbbbbb1-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-4000-8000-000000000003','ACTIF', current_date - 40, current_date - 35, current_date - 35),
  ('ccccccc1-0000-4000-8000-000000000004','LV-000004','bbbbbbb1-0000-4000-8000-000000000004','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-4000-8000-000000000003','ACTIF', current_date - 30, current_date - 25, current_date - 25),
  ('ccccccc1-0000-4000-8000-000000000005','LV-000005','bbbbbbb1-0000-4000-8000-000000000005','11111111-1111-1111-1111-111111111111','aaaaaaa1-0000-4000-8000-000000000002','ACTIF', current_date - 20, current_date - 15, current_date - 15),
  ('ccccccc1-0000-4000-8000-000000000006','LV-000006','bbbbbbb1-0000-4000-8000-000000000006','22222222-2222-2222-2222-222222222222',NULL,'ACTIF', current_date - 18, current_date - 10, current_date - 10),
  ('ccccccc1-0000-4000-8000-000000000007','LV-000007',NULL,'11111111-1111-1111-1111-111111111111',NULL,'EN_STOCK', current_date - 10, NULL, NULL),
  ('ccccccc1-0000-4000-8000-000000000008','LV-000008',NULL,'11111111-1111-1111-1111-111111111111',NULL,'EN_STOCK', current_date - 10, NULL, NULL),
  ('ccccccc1-0000-4000-8000-000000000009','LV-000009',NULL,'11111111-1111-1111-1111-111111111111',NULL,'EN_STOCK', current_date - 10, NULL, NULL),
  ('ccccccc1-0000-4000-8000-000000000010','LV-000010',NULL,'11111111-1111-1111-1111-111111111111',NULL,'EN_STOCK', current_date - 5, NULL, NULL),
  ('ccccccc1-0000-4000-8000-000000000011','LV-000011',NULL,'22222222-2222-2222-2222-222222222222',NULL,'EN_STOCK', current_date - 5, NULL, NULL),
  ('ccccccc1-0000-4000-8000-000000000012','LV-000012',NULL,'22222222-2222-2222-2222-222222222222',NULL,'EN_STOCK', current_date - 5, NULL, NULL);

INSERT INTO public.mouvement_livret (id_livret, type_mouvement, statut_apres, id_agence)
SELECT id_livret, 'RECEPTION', 'EN_STOCK', id_agence FROM public.livret;

-- Ventes de carnets (démonstration)
INSERT INTO public.operation (reference, id_livret, id_epargnant, id_agence, code_type, id_utilisateur, date_operation, date_valeur, montant, statut, date_validation, commentaire)
SELECT 'OP-DEMO-V' || lpad(row_number() OVER (ORDER BY l.numero_livret)::text, 3, '0'),
       l.id_livret, l.id_epargnant, l.id_agence, 'ACHAT_CARNET',
       COALESCE(l.id_collectrice, 'aaaaaaa1-0000-4000-8000-000000000001'::uuid),
       l.date_activation, l.date_activation, 1000, 'VALIDEE', now(), 'Donnée de démonstration'
FROM public.livret l WHERE l.statut = 'ACTIF';

-- Collectes quotidiennes (démonstration)
INSERT INTO public.operation (reference, id_livret, id_epargnant, id_agence, code_type, id_utilisateur, date_operation, date_valeur, montant, statut, date_validation, commentaire)
SELECT 'OP-DEMO-C' || lpad((row_number() OVER (ORDER BY l.numero_livret, d))::text, 4, '0'),
       l.id_livret, l.id_epargnant, l.id_agence, 'COLLECTE',
       COALESCE(l.id_collectrice, 'aaaaaaa1-0000-4000-8000-000000000001'::uuid),
       d::date, d::date, 500 + (abs(hashtext(l.numero_livret || d::text)) % 6) * 250, 'VALIDEE', now(), 'Donnée de démonstration'
FROM public.livret l
CROSS JOIN LATERAL generate_series(l.date_activation, current_date, interval '3 day') AS d
WHERE l.statut = 'ACTIF';

-- Retraits (démonstration)
INSERT INTO public.operation (reference, id_livret, id_epargnant, id_agence, code_type, id_utilisateur, date_operation, date_valeur, montant, statut, date_validation, commentaire) VALUES
  ('OP-DEMO-R001','ccccccc1-0000-4000-8000-000000000001','bbbbbbb1-0000-4000-8000-000000000001','11111111-1111-1111-1111-111111111111','RETRAIT','aaaaaaa1-0000-4000-8000-000000000004', current_date - 7, current_date - 7, 2000,'VALIDEE', now(),'Donnée de démonstration'),
  ('OP-DEMO-R002','ccccccc1-0000-4000-8000-000000000003','bbbbbbb1-0000-4000-8000-000000000003','11111111-1111-1111-1111-111111111111','RETRAIT','aaaaaaa1-0000-4000-8000-000000000004', current_date - 3, current_date - 3, 1500,'VALIDEE', now(),'Donnée de démonstration');

-- Exemple de règle de commission : inactive tant que les taux réels ne sont pas validés
INSERT INTO public.regle_commission (code, libelle, code_type_declencheur, mode_calcul, actif)
VALUES ('COM_VENTE_DEFAUT','Commission sur vente de carnet (taux À VALIDER)','ACHAT_CARNET','A_DEFINIR', false),
       ('COM_RETRAIT_DEFAUT','Commission sur retrait (taux À VALIDER)','RETRAIT','A_DEFINIR', false);