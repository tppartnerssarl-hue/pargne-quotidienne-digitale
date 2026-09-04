import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Prix du carnet actuellement en vigueur dans l'agence de l'utilisateur connecté. */
export function usePrixCarnetCourant(idAgence?: string | null) {
  const { profil } = useAuth();
  const agence = idAgence ?? profil?.id_agence ?? null;
  return useQuery({
    queryKey: ["prix-carnet-courant", agence],
    enabled: Boolean(agence),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("prix_carnet_courant", {
        _id_agence: agence as string,
      });
      if (error) throw error;
      return data === null || data === undefined ? null : Number(data);
    },
    staleTime: 60 * 1000,
  });
}

export type LignePrixCarnet = {
  id_prix: string;
  id_agence: string;
  montant: number;
  date_effet: string;
  commentaire: string | null;
  actif: boolean;
  created_at: string;
  utilisateur: { nom: string; prenom: string } | null;
  agence: { nom: string; code: string } | null;
};

/** Historique complet des prix pratiqués (toutes agences accessibles). */
export function useHistoriquePrixCarnet(idAgence?: string | null) {
  return useQuery({
    queryKey: ["prix-carnet-historique", idAgence ?? "toutes"],
    queryFn: async () => {
      let requete = supabase
        .from("prix_carnet")
        .select(
          "id_prix, id_agence, montant, date_effet, commentaire, actif, created_at, utilisateur:utilisateur(nom, prenom), agence:agence(nom, code)",
        )
        .order("date_effet", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);
      if (idAgence) requete = requete.eq("id_agence", idAgence);
      const { data, error } = await requete;
      if (error) throw error;
      return (data ?? []) as unknown as LignePrixCarnet[];
    },
  });
}
