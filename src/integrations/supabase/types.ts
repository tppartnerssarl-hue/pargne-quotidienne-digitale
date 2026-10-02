export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agence: {
        Row: {
          adresse: string | null
          code: string
          created_at: string
          date_creation: string
          est_demo: boolean
          id_agence: string
          nom: string
          statut: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          code: string
          created_at?: string
          date_creation?: string
          est_demo?: boolean
          id_agence?: string
          nom: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          code?: string
          created_at?: string
          date_creation?: string
          est_demo?: boolean
          id_agence?: string
          nom?: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit: {
        Row: {
          action: string
          adresse_ip: string | null
          ancienne_valeur: Json | null
          auth_user_id: string | null
          code_role: string | null
          contexte: string | null
          date_action: string
          id_agence: string | null
          id_audit: string
          id_cible: string | null
          id_utilisateur: string | null
          nouvelle_valeur: Json | null
          resultat: string
          table_cible: string
        }
        Insert: {
          action: string
          adresse_ip?: string | null
          ancienne_valeur?: Json | null
          auth_user_id?: string | null
          code_role?: string | null
          contexte?: string | null
          date_action?: string
          id_agence?: string | null
          id_audit?: string
          id_cible?: string | null
          id_utilisateur?: string | null
          nouvelle_valeur?: Json | null
          resultat?: string
          table_cible: string
        }
        Update: {
          action?: string
          adresse_ip?: string | null
          ancienne_valeur?: Json | null
          auth_user_id?: string | null
          code_role?: string | null
          contexte?: string | null
          date_action?: string
          id_agence?: string | null
          id_audit?: string
          id_cible?: string | null
          id_utilisateur?: string | null
          nouvelle_valeur?: Json | null
          resultat?: string
          table_cible?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "audit_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "audit_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      commission: {
        Row: {
          base_calcul: number
          date_calcul: string
          date_validation: string | null
          id_agence: string
          id_commission: string
          id_livret: string | null
          id_operation_origine: string | null
          id_periode: string | null
          id_regle: string | null
          id_utilisateur: string | null
          montant: number
          reference: string
          statut: string
        }
        Insert: {
          base_calcul?: number
          date_calcul?: string
          date_validation?: string | null
          id_agence: string
          id_commission?: string
          id_livret?: string | null
          id_operation_origine?: string | null
          id_periode?: string | null
          id_regle?: string | null
          id_utilisateur?: string | null
          montant?: number
          reference: string
          statut?: string
        }
        Update: {
          base_calcul?: number
          date_calcul?: string
          date_validation?: string | null
          id_agence?: string
          id_commission?: string
          id_livret?: string | null
          id_operation_origine?: string | null
          id_periode?: string | null
          id_regle?: string | null
          id_utilisateur?: string | null
          montant?: number
          reference?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "commission_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "commission_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "livret"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "commission_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "commission_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "v_solde_livret"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "commission_id_operation_origine_fkey"
            columns: ["id_operation_origine"]
            isOneToOne: false
            referencedRelation: "operation"
            referencedColumns: ["id_operation"]
          },
          {
            foreignKeyName: "commission_id_operation_origine_fkey"
            columns: ["id_operation_origine"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_operation"]
          },
          {
            foreignKeyName: "commission_id_periode_fkey"
            columns: ["id_periode"]
            isOneToOne: false
            referencedRelation: "periode_commission"
            referencedColumns: ["id_periode"]
          },
          {
            foreignKeyName: "commission_id_regle_fkey"
            columns: ["id_regle"]
            isOneToOne: false
            referencedRelation: "regle_commission"
            referencedColumns: ["id_regle"]
          },
          {
            foreignKeyName: "commission_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      detail_remise: {
        Row: {
          id_detail: string
          id_operation: string
          id_remise: string
          montant: number
        }
        Insert: {
          id_detail?: string
          id_operation: string
          id_remise: string
          montant: number
        }
        Update: {
          id_detail?: string
          id_operation?: string
          id_remise?: string
          montant?: number
        }
        Relationships: [
          {
            foreignKeyName: "detail_remise_id_operation_fkey"
            columns: ["id_operation"]
            isOneToOne: false
            referencedRelation: "operation"
            referencedColumns: ["id_operation"]
          },
          {
            foreignKeyName: "detail_remise_id_operation_fkey"
            columns: ["id_operation"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_operation"]
          },
          {
            foreignKeyName: "detail_remise_id_remise_fkey"
            columns: ["id_remise"]
            isOneToOne: false
            referencedRelation: "remise_caisse"
            referencedColumns: ["id_remise"]
          },
        ]
      }
      epargnant: {
        Row: {
          adresse: string
          created_at: string
          date_creation: string
          est_demo: boolean
          id_agence: string
          id_epargnant: string
          id_zone: string | null
          nom: string
          numero_client: string
          numero_cni: string
          prenom: string
          statut: string
          telephone: string
          updated_at: string
        }
        Insert: {
          adresse: string
          created_at?: string
          date_creation?: string
          est_demo?: boolean
          id_agence: string
          id_epargnant?: string
          id_zone?: string | null
          nom: string
          numero_client: string
          numero_cni: string
          prenom: string
          statut?: string
          telephone: string
          updated_at?: string
        }
        Update: {
          adresse?: string
          created_at?: string
          date_creation?: string
          est_demo?: boolean
          id_agence?: string
          id_epargnant?: string
          id_zone?: string | null
          nom?: string
          numero_client?: string
          numero_cni?: string
          prenom?: string
          statut?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "epargnant_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "epargnant_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "epargnant_id_zone_fkey"
            columns: ["id_zone"]
            isOneToOne: false
            referencedRelation: "zone"
            referencedColumns: ["id_zone"]
          },
        ]
      }
      livret: {
        Row: {
          created_at: string
          date_activation: string | null
          date_attribution: string | null
          date_cloture: string | null
          date_reception: string
          id_agence: string
          id_collectrice: string | null
          id_epargnant: string | null
          id_livret: string
          numero_livret: string
          statut: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_activation?: string | null
          date_attribution?: string | null
          date_cloture?: string | null
          date_reception?: string
          id_agence: string
          id_collectrice?: string | null
          id_epargnant?: string | null
          id_livret?: string
          numero_livret: string
          statut?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_activation?: string | null
          date_attribution?: string | null
          date_cloture?: string | null
          date_reception?: string
          id_agence?: string
          id_collectrice?: string | null
          id_epargnant?: string | null
          id_livret?: string
          numero_livret?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "livret_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "livret_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "livret_id_collectrice_fkey"
            columns: ["id_collectrice"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "livret_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "epargnant"
            referencedColumns: ["id_epargnant"]
          },
          {
            foreignKeyName: "livret_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_epargnant"]
          },
        ]
      }
      mouvement_livret: {
        Row: {
          commentaire: string | null
          date_mouvement: string
          id_agence: string | null
          id_livret: string
          id_mouvement: string
          id_utilisateur: string | null
          statut_apres: string
          statut_avant: string | null
          type_mouvement: string
        }
        Insert: {
          commentaire?: string | null
          date_mouvement?: string
          id_agence?: string | null
          id_livret: string
          id_mouvement?: string
          id_utilisateur?: string | null
          statut_apres: string
          statut_avant?: string | null
          type_mouvement: string
        }
        Update: {
          commentaire?: string | null
          date_mouvement?: string
          id_agence?: string | null
          id_livret?: string
          id_mouvement?: string
          id_utilisateur?: string | null
          statut_apres?: string
          statut_avant?: string | null
          type_mouvement?: string
        }
        Relationships: [
          {
            foreignKeyName: "mouvement_livret_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "mouvement_livret_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "mouvement_livret_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "livret"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "mouvement_livret_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "mouvement_livret_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "v_solde_livret"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "mouvement_livret_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      objectif: {
        Row: {
          actif: boolean
          annee: number
          code_type: string
          created_at: string
          id_agence: string
          id_collectrice: string | null
          id_objectif: string
          mois: number
          montant_cible: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          annee: number
          code_type: string
          created_at?: string
          id_agence: string
          id_collectrice?: string | null
          id_objectif?: string
          mois: number
          montant_cible: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          annee?: number
          code_type?: string
          created_at?: string
          id_agence?: string
          id_collectrice?: string | null
          id_objectif?: string
          mois?: number
          montant_cible?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectif_code_type_fkey"
            columns: ["code_type"]
            isOneToOne: false
            referencedRelation: "type_operation"
            referencedColumns: ["code_type"]
          },
          {
            foreignKeyName: "objectif_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "objectif_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "objectif_id_collectrice_fkey"
            columns: ["id_collectrice"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      operation: {
        Row: {
          code_type: string
          commentaire: string | null
          created_at: string
          date_creation: string
          date_operation: string
          date_valeur: string
          date_validation: string | null
          id_agence: string
          id_epargnant: string | null
          id_livret: string | null
          id_operation: string
          id_operation_origine: string | null
          id_utilisateur: string
          id_valideur: string | null
          montant: number
          reference: string
          statut: string
          updated_at: string
        }
        Insert: {
          code_type: string
          commentaire?: string | null
          created_at?: string
          date_creation?: string
          date_operation?: string
          date_valeur?: string
          date_validation?: string | null
          id_agence: string
          id_epargnant?: string | null
          id_livret?: string | null
          id_operation?: string
          id_operation_origine?: string | null
          id_utilisateur: string
          id_valideur?: string | null
          montant: number
          reference: string
          statut?: string
          updated_at?: string
        }
        Update: {
          code_type?: string
          commentaire?: string | null
          created_at?: string
          date_creation?: string
          date_operation?: string
          date_valeur?: string
          date_validation?: string | null
          id_agence?: string
          id_epargnant?: string | null
          id_livret?: string | null
          id_operation?: string
          id_operation_origine?: string | null
          id_utilisateur?: string
          id_valideur?: string | null
          montant?: number
          reference?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operation_code_type_fkey"
            columns: ["code_type"]
            isOneToOne: false
            referencedRelation: "type_operation"
            referencedColumns: ["code_type"]
          },
          {
            foreignKeyName: "operation_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "operation_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "operation_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "epargnant"
            referencedColumns: ["id_epargnant"]
          },
          {
            foreignKeyName: "operation_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_epargnant"]
          },
          {
            foreignKeyName: "operation_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "livret"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "operation_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "operation_id_livret_fkey"
            columns: ["id_livret"]
            isOneToOne: false
            referencedRelation: "v_solde_livret"
            referencedColumns: ["id_livret"]
          },
          {
            foreignKeyName: "operation_id_operation_origine_fkey"
            columns: ["id_operation_origine"]
            isOneToOne: false
            referencedRelation: "operation"
            referencedColumns: ["id_operation"]
          },
          {
            foreignKeyName: "operation_id_operation_origine_fkey"
            columns: ["id_operation_origine"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_operation"]
          },
          {
            foreignKeyName: "operation_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "operation_id_valideur_fkey"
            columns: ["id_valideur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      parametre: {
        Row: {
          a_valider: boolean
          cle: string
          libelle: string
          type_valeur: string
          updated_at: string
          valeur: string | null
        }
        Insert: {
          a_valider?: boolean
          cle: string
          libelle: string
          type_valeur?: string
          updated_at?: string
          valeur?: string | null
        }
        Update: {
          a_valider?: boolean
          cle?: string
          libelle?: string
          type_valeur?: string
          updated_at?: string
          valeur?: string | null
        }
        Relationships: []
      }
      periode_commission: {
        Row: {
          annee: number
          date_debut: string
          date_fin: string
          id_periode: string
          mois: number
          statut: string
        }
        Insert: {
          annee: number
          date_debut: string
          date_fin: string
          id_periode?: string
          mois: number
          statut?: string
        }
        Update: {
          annee?: number
          date_debut?: string
          date_fin?: string
          id_periode?: string
          mois?: number
          statut?: string
        }
        Relationships: []
      }
      planning_collecte: {
        Row: {
          actif: boolean
          created_at: string
          id_agence: string
          id_collectrice: string
          id_epargnant: string | null
          id_planning: string
          id_zone: string | null
          jour_semaine: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id_agence: string
          id_collectrice: string
          id_epargnant?: string | null
          id_planning?: string
          id_zone?: string | null
          jour_semaine: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id_agence?: string
          id_collectrice?: string
          id_epargnant?: string | null
          id_planning?: string
          id_zone?: string | null
          jour_semaine?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_collecte_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "planning_collecte_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "planning_collecte_id_collectrice_fkey"
            columns: ["id_collectrice"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "planning_collecte_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "epargnant"
            referencedColumns: ["id_epargnant"]
          },
          {
            foreignKeyName: "planning_collecte_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_epargnant"]
          },
          {
            foreignKeyName: "planning_collecte_id_zone_fkey"
            columns: ["id_zone"]
            isOneToOne: false
            referencedRelation: "zone"
            referencedColumns: ["id_zone"]
          },
        ]
      }
      prix_carnet: {
        Row: {
          actif: boolean
          commentaire: string | null
          created_at: string
          date_effet: string
          id_agence: string
          id_prix: string
          id_utilisateur: string | null
          montant: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          commentaire?: string | null
          created_at?: string
          date_effet?: string
          id_agence: string
          id_prix?: string
          id_utilisateur?: string | null
          montant: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          commentaire?: string | null
          created_at?: string
          date_effet?: string
          id_agence?: string
          id_prix?: string
          id_utilisateur?: string | null
          montant?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prix_carnet_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "prix_carnet_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "prix_carnet_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      regle_commission: {
        Row: {
          actif: boolean
          code: string
          code_type_declencheur: string | null
          created_at: string
          date_debut: string
          date_fin: string | null
          id_regle: string
          libelle: string
          mode_calcul: string
          montant_fixe: number | null
          seuil_max: number | null
          seuil_min: number | null
          taux: number | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code: string
          code_type_declencheur?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id_regle?: string
          libelle: string
          mode_calcul: string
          montant_fixe?: number | null
          seuil_max?: number | null
          seuil_min?: number | null
          taux?: number | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code?: string
          code_type_declencheur?: string | null
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id_regle?: string
          libelle?: string
          mode_calcul?: string
          montant_fixe?: number | null
          seuil_max?: number | null
          seuil_min?: number | null
          taux?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regle_commission_code_type_declencheur_fkey"
            columns: ["code_type_declencheur"]
            isOneToOne: false
            referencedRelation: "type_operation"
            referencedColumns: ["code_type"]
          },
        ]
      }
      remise_caisse: {
        Row: {
          commentaire: string | null
          created_at: string
          date_remise: string
          date_validation: string | null
          ecart: number | null
          id_agence: string
          id_caissier: string | null
          id_remise: string
          id_utilisateur: string
          montant_attendu: number
          montant_controle: number | null
          montant_declare: number
          reference: string
          statut: string
          updated_at: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          date_remise?: string
          date_validation?: string | null
          ecart?: number | null
          id_agence: string
          id_caissier?: string | null
          id_remise?: string
          id_utilisateur: string
          montant_attendu?: number
          montant_controle?: number | null
          montant_declare?: number
          reference: string
          statut?: string
          updated_at?: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          date_remise?: string
          date_validation?: string | null
          ecart?: number | null
          id_agence?: string
          id_caissier?: string | null
          id_remise?: string
          id_utilisateur?: string
          montant_attendu?: number
          montant_controle?: number | null
          montant_declare?: number
          reference?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remise_caisse_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "remise_caisse_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "remise_caisse_id_caissier_fkey"
            columns: ["id_caissier"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "remise_caisse_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      role: {
        Row: {
          code: string
          description: string | null
          id_role: string
          libelle: string
        }
        Insert: {
          code: string
          description?: string | null
          id_role?: string
          libelle: string
        }
        Update: {
          code?: string
          description?: string | null
          id_role?: string
          libelle?: string
        }
        Relationships: []
      }
      type_operation: {
        Row: {
          actif: boolean
          code_type: string
          est_financier: boolean
          libelle: string
          sens: string
        }
        Insert: {
          actif?: boolean
          code_type: string
          est_financier?: boolean
          libelle: string
          sens: string
        }
        Update: {
          actif?: boolean
          code_type?: string
          est_financier?: boolean
          libelle?: string
          sens?: string
        }
        Relationships: []
      }
      utilisateur: {
        Row: {
          auth_user_id: string | null
          created_at: string
          date_creation: string
          email: string
          est_demo: boolean
          id_agence: string | null
          id_utilisateur: string
          login: string | null
          nom: string
          prenom: string
          statut: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          date_creation?: string
          email: string
          est_demo?: boolean
          id_agence?: string | null
          id_utilisateur?: string
          login?: string | null
          nom: string
          prenom: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          date_creation?: string
          email?: string
          est_demo?: boolean
          id_agence?: string | null
          id_utilisateur?: string
          login?: string | null
          nom?: string
          prenom?: string
          statut?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilisateur_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "utilisateur_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
        ]
      }
      utilisateur_role: {
        Row: {
          date_attribution: string
          id_role: string
          id_utilisateur: string
        }
        Insert: {
          date_attribution?: string
          id_role: string
          id_utilisateur: string
        }
        Update: {
          date_attribution?: string
          id_role?: string
          id_utilisateur?: string
        }
        Relationships: [
          {
            foreignKeyName: "utilisateur_role_id_role_fkey"
            columns: ["id_role"]
            isOneToOne: false
            referencedRelation: "role"
            referencedColumns: ["id_role"]
          },
          {
            foreignKeyName: "utilisateur_role_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      zone: {
        Row: {
          actif: boolean
          code: string
          created_at: string
          id_agence: string
          id_zone: string
          libelle: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          code: string
          created_at?: string
          id_agence: string
          id_zone?: string
          libelle: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          code?: string
          created_at?: string
          id_agence?: string
          id_zone?: string
          libelle?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "zone_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
        ]
      }
    }
    Views: {
      v_situation_individuelle: {
        Row: {
          code_type: string | null
          date_operation: string | null
          id_agence: string | null
          id_epargnant: string | null
          id_livret: string | null
          id_operation: string | null
          libelle_type: string | null
          montant_credit: number | null
          montant_debit: number | null
          nom: string | null
          numero_client: string | null
          numero_livret: string | null
          prenom: string | null
          reference: string | null
          solde_progressif: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_code_type_fkey"
            columns: ["code_type"]
            isOneToOne: false
            referencedRelation: "type_operation"
            referencedColumns: ["code_type"]
          },
          {
            foreignKeyName: "operation_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "operation_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
        ]
      }
      v_solde_livret: {
        Row: {
          derniere_operation: string | null
          id_agence: string | null
          id_epargnant: string | null
          id_livret: string | null
          numero_livret: string | null
          solde: number | null
          total_credit: number | null
          total_debit: number | null
        }
        Relationships: [
          {
            foreignKeyName: "livret_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "livret_id_agence_fkey"
            columns: ["id_agence"]
            isOneToOne: false
            referencedRelation: "v_stock_agence"
            referencedColumns: ["id_agence"]
          },
          {
            foreignKeyName: "livret_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "epargnant"
            referencedColumns: ["id_epargnant"]
          },
          {
            foreignKeyName: "livret_id_epargnant_fkey"
            columns: ["id_epargnant"]
            isOneToOne: false
            referencedRelation: "v_situation_individuelle"
            referencedColumns: ["id_epargnant"]
          },
        ]
      }
      v_stock_agence: {
        Row: {
          actif: number | null
          attribue: number | null
          bloque: number | null
          cloture: number | null
          code: string | null
          disponible: number | null
          id_agence: string | null
          nom: string | null
          perdu: number | null
          total_recu: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      a_role: { Args: { _code: string }; Returns: boolean }
      acces_agence: { Args: { _id_agence: string }; Returns: boolean }
      affecter_livrets_collectrice: {
        Args: {
          _commentaire?: string
          _id_collectrice: string
          _ids_livret: string[]
        }
        Returns: number
      }
      agence_courante: { Args: never; Returns: string }
      annuler_operation: {
        Args: { _id_operation: string; _motif: string }
        Returns: string
      }
      calculer_commission: {
        Args: { _base: number; _code_type: string; _date: string }
        Returns: {
          id_regle: string
          montant: number
        }[]
      }
      changer_statut_livret: {
        Args: { _id_livret: string; _motif?: string; _statut: string }
        Returns: string
      }
      controler_remise:
        | {
            Args: {
              _id_remise: string
              _montant_controle: number
              _valider?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              _commentaire?: string
              _id_remise: string
              _montant_controle: number
              _valider?: boolean
            }
            Returns: string
          }
      creer_remise: {
        Args: { _commentaire?: string; _date: string; _montant_declare: number }
        Returns: string
      }
      definir_prix_carnet: {
        Args: {
          _commentaire?: string
          _date_effet?: string
          _id_agence: string
          _montant: number
        }
        Returns: string
      }
      enregistrer_collecte: {
        Args: {
          _commentaire?: string
          _date?: string
          _id_livret: string
          _montant: number
        }
        Returns: string
      }
      enregistrer_commission: {
        Args: {
          _base: number
          _code_type: string
          _date: string
          _id_agence: string
          _id_livret: string
          _id_operation: string
          _id_utilisateur: string
        }
        Returns: string
      }
      enregistrer_depot: {
        Args: {
          _commentaire?: string
          _date?: string
          _id_livret: string
          _montant: number
        }
        Returns: string
      }
      enregistrer_retrait: {
        Args: {
          _commentaire?: string
          _date?: string
          _id_livret: string
          _montant: number
        }
        Returns: string
      }
      enregistrer_vente: {
        Args: {
          _commentaire?: string
          _date?: string
          _id_epargnant: string
          _id_livret: string
          _montant: number
        }
        Returns: string
      }
      epargnants_sans_collecte: {
        Args: { _jours?: number }
        Returns: {
          derniere_collecte: string
          id_epargnant: string
          jours_sans_collecte: number
          nom: string
          numero_client: string
          prenom: string
          telephone: string
        }[]
      }
      est_admin: { Args: never; Returns: boolean }
      generer_reference: {
        Args: { _prefixe: string; _seq: unknown }
        Returns: string
      }
      prix_carnet_courant: { Args: { _id_agence: string }; Returns: number }
      prochain_numero_client: { Args: never; Returns: string }
      receptionner_livrets: {
        Args: { _id_agence: string; _numeros: string[] }
        Returns: number
      }
      suivi_objectifs: {
        Args: { _annee: number; _mois: number }
        Returns: {
          code_type: string
          collectrice: string
          id_collectrice: string
          montant_cible: number
          montant_realise: number
          taux_atteinte: number
        }[]
      }
      transferer_livret: {
        Args: { _id_collectrice: string; _id_livret: string; _motif: string }
        Returns: string
      }
      utilisateur_courant: { Args: never; Returns: string }
      valider_operation: { Args: { _id_operation: string }; Returns: string }
      voit_tout: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
