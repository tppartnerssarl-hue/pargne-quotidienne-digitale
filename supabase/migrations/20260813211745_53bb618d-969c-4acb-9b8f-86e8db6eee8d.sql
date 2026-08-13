-- ============ UTILITAIRES ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ AGENCE ============
CREATE TABLE public.agence (
  id_agence uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  nom text NOT NULL,
  adresse text,
  telephone text,
  statut text NOT NULL DEFAULT 'ACTIVE' CHECK (statut IN ('ACTIVE','INACTIVE')),
  date_creation date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_agence_upd BEFORE UPDATE ON public.agence FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ ROLE ============
CREATE TABLE public.role (
  id_role uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  libelle text NOT NULL,
  description text
);

-- ============ UTILISATEUR ============
CREATE TABLE public.utilisateur (
  id_utilisateur uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,
  id_agence uuid REFERENCES public.agence(id_agence),
  nom text NOT NULL,
  prenom text NOT NULL,
  login text UNIQUE,
  email text NOT NULL UNIQUE,
  telephone text,
  statut text NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','INACTIF','SUSPENDU')),
  date_creation date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_utilisateur_agence ON public.utilisateur(id_agence);
CREATE TRIGGER trg_utilisateur_upd BEFORE UPDATE ON public.utilisateur FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.utilisateur_role (
  id_utilisateur uuid NOT NULL REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE,
  id_role uuid NOT NULL REFERENCES public.role(id_role) ON DELETE CASCADE,
  date_attribution timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id_utilisateur, id_role)
);

-- ============ EPARGNANT ============
CREATE TABLE public.epargnant (
  id_epargnant uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_client text NOT NULL UNIQUE,
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  nom text NOT NULL,
  prenom text NOT NULL,
  telephone text,
  adresse text,
  numero_cni text,
  statut text NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF','INACTIF','CLOTURE')),
  date_creation date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_epargnant_agence ON public.epargnant(id_agence);
CREATE INDEX idx_epargnant_nom ON public.epargnant(nom, prenom);
CREATE INDEX idx_epargnant_tel ON public.epargnant(telephone);
CREATE TRIGGER trg_epargnant_upd BEFORE UPDATE ON public.epargnant FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ LIVRET ============
CREATE TABLE public.livret (
  id_livret uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_livret text NOT NULL UNIQUE,
  id_epargnant uuid REFERENCES public.epargnant(id_epargnant),
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  id_collectrice uuid REFERENCES public.utilisateur(id_utilisateur),
  statut text NOT NULL DEFAULT 'EN_STOCK' CHECK (statut IN ('EN_STOCK','ATTRIBUE','ACTIF','BLOQUE','CLOTURE','PERDU')),
  date_reception date NOT NULL DEFAULT current_date,
  date_attribution date,
  date_activation date,
  date_cloture date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_livret_epargnant CHECK (statut = 'EN_STOCK' OR id_epargnant IS NOT NULL)
);
CREATE INDEX idx_livret_numero ON public.livret(numero_livret);
CREATE INDEX idx_livret_agence ON public.livret(id_agence);
CREATE INDEX idx_livret_epargnant ON public.livret(id_epargnant);
CREATE INDEX idx_livret_collectrice ON public.livret(id_collectrice);
CREATE TRIGGER trg_livret_upd BEFORE UPDATE ON public.livret FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.mouvement_livret (
  id_mouvement uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_livret uuid NOT NULL REFERENCES public.livret(id_livret),
  type_mouvement text NOT NULL CHECK (type_mouvement IN ('RECEPTION','TRANSFERT','ATTRIBUTION','ACTIVATION','BLOCAGE','DEBLOCAGE','CLOTURE','PERTE')),
  statut_avant text,
  statut_apres text NOT NULL,
  id_utilisateur uuid REFERENCES public.utilisateur(id_utilisateur),
  id_agence uuid REFERENCES public.agence(id_agence),
  commentaire text,
  date_mouvement timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mvt_livret ON public.mouvement_livret(id_livret);

-- ============ OPERATIONS ============
CREATE TABLE public.type_operation (
  code_type text PRIMARY KEY,
  libelle text NOT NULL,
  sens text NOT NULL CHECK (sens IN ('CREDIT','DEBIT')),
  est_financier boolean NOT NULL DEFAULT true,
  actif boolean NOT NULL DEFAULT true
);

CREATE TABLE public.operation (
  id_operation uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  id_livret uuid REFERENCES public.livret(id_livret),
  id_epargnant uuid REFERENCES public.epargnant(id_epargnant),
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  code_type text NOT NULL REFERENCES public.type_operation(code_type),
  id_utilisateur uuid NOT NULL REFERENCES public.utilisateur(id_utilisateur),
  date_operation date NOT NULL DEFAULT current_date,
  date_valeur date NOT NULL DEFAULT current_date,
  montant numeric(14,2) NOT NULL CHECK (montant > 0),
  statut text NOT NULL DEFAULT 'VALIDEE' CHECK (statut IN ('BROUILLON','EN_ATTENTE','VALIDEE','ANNULEE','REVERSEE')),
  id_operation_origine uuid REFERENCES public.operation(id_operation),
  commentaire text,
  date_creation timestamptz NOT NULL DEFAULT now(),
  date_validation timestamptz,
  id_valideur uuid REFERENCES public.utilisateur(id_utilisateur),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_op_livret ON public.operation(id_livret);
CREATE INDEX idx_op_agence ON public.operation(id_agence);
CREATE INDEX idx_op_util ON public.operation(id_utilisateur);
CREATE INDEX idx_op_date ON public.operation(date_operation);
CREATE INDEX idx_op_type ON public.operation(code_type);
CREATE TRIGGER trg_operation_upd BEFORE UPDATE ON public.operation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ COMMISSIONS ============
CREATE TABLE public.regle_commission (
  id_regle uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  libelle text NOT NULL,
  code_type_declencheur text REFERENCES public.type_operation(code_type),
  seuil_min numeric(14,2),
  seuil_max numeric(14,2),
  montant_fixe numeric(14,2),
  taux numeric(9,6),
  mode_calcul text NOT NULL CHECK (mode_calcul IN ('FIXE','TAUX','PALIER','A_DEFINIR')),
  date_debut date NOT NULL DEFAULT current_date,
  date_fin date,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_regle_dates CHECK (date_fin IS NULL OR date_fin >= date_debut)
);
CREATE TRIGGER trg_regle_upd BEFORE UPDATE ON public.regle_commission FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.periode_commission (
  id_periode uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annee int NOT NULL,
  mois int NOT NULL CHECK (mois BETWEEN 1 AND 12),
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  statut text NOT NULL DEFAULT 'OUVERTE' CHECK (statut IN ('OUVERTE','CLOTUREE','VALIDEE')),
  UNIQUE (annee, mois)
);

CREATE TABLE public.commission (
  id_commission uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  id_livret uuid REFERENCES public.livret(id_livret),
  id_regle uuid REFERENCES public.regle_commission(id_regle),
  id_periode uuid REFERENCES public.periode_commission(id_periode),
  id_operation_origine uuid REFERENCES public.operation(id_operation),
  id_utilisateur uuid REFERENCES public.utilisateur(id_utilisateur),
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  date_calcul timestamptz NOT NULL DEFAULT now(),
  base_calcul numeric(14,2) NOT NULL DEFAULT 0,
  montant numeric(14,2) NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'CALCULEE' CHECK (statut IN ('CALCULEE','VALIDEE','ANNULEE')),
  date_validation timestamptz
);
CREATE INDEX idx_commission_agence ON public.commission(id_agence);

-- ============ CAISSE ============
CREATE TABLE public.remise_caisse (
  id_remise uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  id_agence uuid NOT NULL REFERENCES public.agence(id_agence),
  id_utilisateur uuid NOT NULL REFERENCES public.utilisateur(id_utilisateur),
  id_caissier uuid REFERENCES public.utilisateur(id_utilisateur),
  date_remise date NOT NULL DEFAULT current_date,
  montant_attendu numeric(14,2) NOT NULL DEFAULT 0,
  montant_declare numeric(14,2) NOT NULL DEFAULT 0 CHECK (montant_declare >= 0),
  montant_controle numeric(14,2),
  ecart numeric(14,2) GENERATED ALWAYS AS (COALESCE(montant_controle, montant_declare) - montant_attendu) STORED,
  statut text NOT NULL DEFAULT 'DECLAREE' CHECK (statut IN ('DECLAREE','CONTROLEE','VALIDEE','REJETEE')),
  commentaire text,
  date_validation timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_remise_agence ON public.remise_caisse(id_agence);
CREATE TRIGGER trg_remise_upd BEFORE UPDATE ON public.remise_caisse FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.detail_remise (
  id_detail uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_remise uuid NOT NULL REFERENCES public.remise_caisse(id_remise) ON DELETE CASCADE,
  id_operation uuid NOT NULL REFERENCES public.operation(id_operation),
  montant numeric(14,2) NOT NULL,
  UNIQUE (id_remise, id_operation)
);

-- ============ PARAMETRES ============
CREATE TABLE public.parametre (
  cle text PRIMARY KEY,
  valeur text,
  libelle text NOT NULL,
  type_valeur text NOT NULL DEFAULT 'TEXTE' CHECK (type_valeur IN ('TEXTE','NOMBRE','BOOLEEN','DATE')),
  a_valider boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_parametre_upd BEFORE UPDATE ON public.parametre FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ AUDIT ============
CREATE TABLE public.audit (
  id_audit uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_utilisateur uuid REFERENCES public.utilisateur(id_utilisateur),
  auth_user_id uuid,
  date_action timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  table_cible text NOT NULL,
  id_cible text,
  ancienne_valeur jsonb,
  nouvelle_valeur jsonb,
  adresse_ip text
);
CREATE INDEX idx_audit_date ON public.audit(date_action DESC);
CREATE INDEX idx_audit_table ON public.audit(table_cible);

-- ============ FONCTIONS DE SECURITE ============
CREATE OR REPLACE FUNCTION public.utilisateur_courant()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id_utilisateur FROM public.utilisateur WHERE auth_user_id = auth.uid() AND statut = 'ACTIF' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.agence_courante()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id_agence FROM public.utilisateur WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.a_role(_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.utilisateur u
    JOIN public.utilisateur_role ur ON ur.id_utilisateur = u.id_utilisateur
    JOIN public.role r ON r.id_role = ur.id_role
    WHERE u.auth_user_id = auth.uid() AND u.statut = 'ACTIF' AND r.code = _code
  );
$$;

CREATE OR REPLACE FUNCTION public.est_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.a_role('ADMINISTRATEUR'); $$;
CREATE OR REPLACE FUNCTION public.voit_tout() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.a_role('ADMINISTRATEUR') OR public.a_role('DIRECTION'); $$;

-- accès aux données d'une agence
CREATE OR REPLACE FUNCTION public.acces_agence(_id_agence uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.voit_tout() OR _id_agence = public.agence_courante();
$$;

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE ON public.agence, public.utilisateur, public.epargnant, public.livret, public.operation,
  public.regle_commission, public.periode_commission, public.commission, public.remise_caisse, public.parametre TO authenticated;
GRANT SELECT, INSERT ON public.mouvement_livret, public.detail_remise, public.audit, public.utilisateur_role TO authenticated;
GRANT DELETE ON public.utilisateur_role TO authenticated;
GRANT SELECT ON public.role, public.type_operation TO authenticated;
GRANT ALL ON public.agence, public.role, public.utilisateur, public.utilisateur_role, public.epargnant, public.livret,
  public.mouvement_livret, public.type_operation, public.operation, public.regle_commission, public.periode_commission,
  public.commission, public.remise_caisse, public.detail_remise, public.parametre, public.audit TO service_role;

-- ============ RLS ============
ALTER TABLE public.agence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateur_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epargnant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livret ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mouvement_livret ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.type_operation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regle_commission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periode_commission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remise_caisse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detail_remise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametre ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit ENABLE ROW LEVEL SECURITY;

-- Référentiels lisibles par tout utilisateur authentifié
CREATE POLICY p_role_read ON public.role FOR SELECT TO authenticated USING (true);
CREATE POLICY p_type_op_read ON public.type_operation FOR SELECT TO authenticated USING (true);
CREATE POLICY p_param_read ON public.parametre FOR SELECT TO authenticated USING (true);
CREATE POLICY p_param_write ON public.parametre FOR UPDATE TO authenticated USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY p_param_ins ON public.parametre FOR INSERT TO authenticated WITH CHECK (public.est_admin());

-- Agence
CREATE POLICY p_agence_read ON public.agence FOR SELECT TO authenticated USING (public.voit_tout() OR id_agence = public.agence_courante());
CREATE POLICY p_agence_ins ON public.agence FOR INSERT TO authenticated WITH CHECK (public.est_admin());
CREATE POLICY p_agence_upd ON public.agence FOR UPDATE TO authenticated USING (public.est_admin()) WITH CHECK (public.est_admin());

-- Utilisateur
CREATE POLICY p_util_read ON public.utilisateur FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.voit_tout() OR id_agence = public.agence_courante());
CREATE POLICY p_util_ins ON public.utilisateur FOR INSERT TO authenticated WITH CHECK (public.est_admin());
CREATE POLICY p_util_upd ON public.utilisateur FOR UPDATE TO authenticated USING (public.est_admin()) WITH CHECK (public.est_admin());

CREATE POLICY p_ur_read ON public.utilisateur_role FOR SELECT TO authenticated
  USING (public.voit_tout() OR id_utilisateur = public.utilisateur_courant());
CREATE POLICY p_ur_ins ON public.utilisateur_role FOR INSERT TO authenticated WITH CHECK (public.est_admin());
CREATE POLICY p_ur_del ON public.utilisateur_role FOR DELETE TO authenticated USING (public.est_admin());

-- Epargnant
CREATE POLICY p_epargnant_read ON public.epargnant FOR SELECT TO authenticated USING (public.acces_agence(id_agence));
CREATE POLICY p_epargnant_ins ON public.epargnant FOR INSERT TO authenticated
  WITH CHECK (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE') OR public.a_role('COLLECTRICE')));
CREATE POLICY p_epargnant_upd ON public.epargnant FOR UPDATE TO authenticated
  USING (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')))
  WITH CHECK (public.acces_agence(id_agence));

-- Livret : la collectrice ne voit que les siens
CREATE POLICY p_livret_read ON public.livret FOR SELECT TO authenticated
  USING (public.voit_tout() OR (id_agence = public.agence_courante()
    AND (NOT public.a_role('COLLECTRICE') OR public.a_role('RESPONSABLE_AGENCE') OR public.a_role('CAISSIER')
         OR id_collectrice = public.utilisateur_courant() OR statut = 'EN_STOCK')));
CREATE POLICY p_livret_ins ON public.livret FOR INSERT TO authenticated
  WITH CHECK (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE')));
CREATE POLICY p_livret_upd ON public.livret FOR UPDATE TO authenticated
  USING (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE') OR public.a_role('COLLECTRICE')))
  WITH CHECK (public.acces_agence(id_agence));

CREATE POLICY p_mvt_read ON public.mouvement_livret FOR SELECT TO authenticated
  USING (public.voit_tout() OR id_agence = public.agence_courante());
CREATE POLICY p_mvt_ins ON public.mouvement_livret FOR INSERT TO authenticated
  WITH CHECK (public.acces_agence(id_agence));

-- Operation : collectrice = ses opérations uniquement
CREATE POLICY p_op_read ON public.operation FOR SELECT TO authenticated
  USING (public.voit_tout() OR (id_agence = public.agence_courante()
    AND (NOT public.a_role('COLLECTRICE') OR public.a_role('RESPONSABLE_AGENCE') OR public.a_role('CAISSIER')
         OR id_utilisateur = public.utilisateur_courant())));
CREATE POLICY p_op_ins ON public.operation FOR INSERT TO authenticated
  WITH CHECK (public.acces_agence(id_agence) AND id_utilisateur = public.utilisateur_courant());
-- Une opération VALIDEE ne peut plus être modifiée directement
CREATE POLICY p_op_upd ON public.operation FOR UPDATE TO authenticated
  USING (public.acces_agence(id_agence) AND statut IN ('BROUILLON','EN_ATTENTE')
    AND (public.est_admin() OR public.a_role('RESPONSABLE_AGENCE') OR public.a_role('CAISSIER') OR public.a_role('DIRECTION')))
  WITH CHECK (public.acces_agence(id_agence));

-- Commissions
CREATE POLICY p_regle_read ON public.regle_commission FOR SELECT TO authenticated USING (true);
CREATE POLICY p_regle_ins ON public.regle_commission FOR INSERT TO authenticated WITH CHECK (public.est_admin());
CREATE POLICY p_regle_upd ON public.regle_commission FOR UPDATE TO authenticated USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY p_periode_read ON public.periode_commission FOR SELECT TO authenticated USING (true);
CREATE POLICY p_periode_ins ON public.periode_commission FOR INSERT TO authenticated WITH CHECK (public.est_admin());
CREATE POLICY p_periode_upd ON public.periode_commission FOR UPDATE TO authenticated USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY p_commission_read ON public.commission FOR SELECT TO authenticated
  USING (public.voit_tout() OR (id_agence = public.agence_courante()
    AND (NOT public.a_role('COLLECTRICE') OR public.a_role('RESPONSABLE_AGENCE') OR id_utilisateur = public.utilisateur_courant())));
CREATE POLICY p_commission_ins ON public.commission FOR INSERT TO authenticated WITH CHECK (public.acces_agence(id_agence));
CREATE POLICY p_commission_upd ON public.commission FOR UPDATE TO authenticated
  USING (public.est_admin() OR public.a_role('DIRECTION')) WITH CHECK (true);

-- Caisse
CREATE POLICY p_remise_read ON public.remise_caisse FOR SELECT TO authenticated
  USING (public.voit_tout() OR (id_agence = public.agence_courante()
    AND (NOT public.a_role('COLLECTRICE') OR public.a_role('CAISSIER') OR public.a_role('RESPONSABLE_AGENCE') OR id_utilisateur = public.utilisateur_courant())));
CREATE POLICY p_remise_ins ON public.remise_caisse FOR INSERT TO authenticated
  WITH CHECK (public.acces_agence(id_agence) AND id_utilisateur = public.utilisateur_courant());
CREATE POLICY p_remise_upd ON public.remise_caisse FOR UPDATE TO authenticated
  USING (public.acces_agence(id_agence) AND (public.est_admin() OR public.a_role('CAISSIER') OR public.a_role('RESPONSABLE_AGENCE')))
  WITH CHECK (public.acces_agence(id_agence));
CREATE POLICY p_detail_read ON public.detail_remise FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.remise_caisse r WHERE r.id_remise = detail_remise.id_remise AND public.acces_agence(r.id_agence)));
CREATE POLICY p_detail_ins ON public.detail_remise FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.remise_caisse r WHERE r.id_remise = detail_remise.id_remise AND public.acces_agence(r.id_agence)));

-- Audit : lecture réservée
CREATE POLICY p_audit_read ON public.audit FOR SELECT TO authenticated USING (public.voit_tout());
CREATE POLICY p_audit_ins ON public.audit FOR INSERT TO authenticated WITH CHECK (true);

-- ============ REFERENTIELS DE BASE ============
INSERT INTO public.role (code, libelle, description) VALUES
  ('ADMINISTRATEUR','Administrateur','Gestion complète du système'),
  ('DIRECTION','Direction','Consultation globale et validation'),
  ('RESPONSABLE_AGENCE','Responsable d''agence','Gestion opérationnelle de son agence'),
  ('COLLECTRICE','Collectrice','Vente de livrets et collectes sur le terrain'),
  ('CAISSIER','Caissier','Retraits, remises et contrôle de caisse');

INSERT INTO public.type_operation (code_type, libelle, sens, est_financier) VALUES
  ('ACHAT_CARNET','Achat de carnet','CREDIT',true),
  ('COLLECTE','Collecte quotidienne','CREDIT',true),
  ('RETRAIT','Retrait','DEBIT',true),
  ('COMMISSION_VENTE','Commission sur vente','DEBIT',true),
  ('COMMISSION_RETRAIT','Commission sur retrait','DEBIT',true),
  ('COMMISSION_MENSUELLE','Commission mensuelle','DEBIT',true),
  ('AJUSTEMENT','Ajustement','CREDIT',true);

INSERT INTO public.parametre (cle, valeur, libelle, type_valeur, a_valider) VALUES
  ('devise_code','XAF','Code devise','TEXTE',true),
  ('devise_libelle','FCFA','Libellé devise','TEXTE',true),
  ('fuseau_horaire','Africa/Douala','Fuseau horaire','TEXTE',true),
  ('retrait_montant_min',NULL,'Montant minimum de retrait','NOMBRE',true),
  ('retrait_montant_max',NULL,'Montant maximum de retrait','NOMBRE',true),
  ('retrait_solde_negatif_autorise','false','Autoriser un retrait supérieur au solde','BOOLEEN',true),
  ('retrait_validation_obligatoire','true','Le retrait doit être validé par un caissier','BOOLEEN',true),
  ('collecte_multi_jours_autorisee','false','Autoriser la saisie de plusieurs jours en une collecte','BOOLEEN',true),
  ('collecte_correction_delai_heures',NULL,'Délai de correction d''une collecte (heures)','NOMBRE',true),
  ('prix_vente_carnet',NULL,'Prix de vente du carnet','NOMBRE',true),
  ('cloture_livret_politique',NULL,'Politique de clôture d''un livret','TEXTE',true),
  ('mode_hors_connexion','false','Fonctionnement hors connexion','BOOLEEN',true);