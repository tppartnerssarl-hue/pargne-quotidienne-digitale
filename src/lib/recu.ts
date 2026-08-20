import { supabase } from "@/integrations/supabase/client";

export type LigneRecu = { label: string; valeur: string };

export type DonneesRecu = {
  titre: string;
  reference: string;
  dateTexte: string;
  lignes: LigneRecu[];
  montantLibelle: string;
  montantTexte: string;
  mention?: string;
};

/** Charge les informations nécessaires à l'impression d'un reçu d'opération. */
export async function chargerOperationRecu(idOperation: string) {
  const { data, error } = await supabase
    .from("operation")
    .select(
      "id_operation, reference, code_type, montant, date_operation, date_creation, statut, commentaire, livret:livret(numero_livret), epargnant:epargnant(numero_client, nom, prenom), agence:agence(code, nom), operateur:utilisateur!operation_id_utilisateur_fkey(nom, prenom)",
    )
    .eq("id_operation", idOperation)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as {
    id_operation: string;
    reference: string;
    code_type: string;
    montant: number;
    date_operation: string;
    date_creation: string;
    statut: string;
    livret: { numero_livret: string } | null;
    epargnant: { numero_client: string; nom: string; prenom: string } | null;
    agence: { code: string; nom: string } | null;
    operateur: { nom: string; prenom: string } | null;
  } | null;
}
