import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CONFIG_PAR_DEFAUT, type Configuration } from "@/lib/format";

export type Parametre = {
  cle: string;
  valeur: string | null;
  libelle: string;
  type_valeur: string;
  a_valider: boolean;
};

export function useParametres() {
  return useQuery({
    queryKey: ["parametres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametre").select("*").order("cle");
      if (error) throw error;
      return (data ?? []) as Parametre[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useConfiguration(): Configuration {
  const { data } = useParametres();
  if (!data) return CONFIG_PAR_DEFAUT;
  const lire = (cle: string, defaut: string) =>
    data.find((p) => p.cle === cle)?.valeur || defaut;
  return {
    devise_code: lire("devise_code", CONFIG_PAR_DEFAUT.devise_code),
    devise_libelle: lire("devise_libelle", CONFIG_PAR_DEFAUT.devise_libelle),
    fuseau_horaire: lire("fuseau_horaire", CONFIG_PAR_DEFAUT.fuseau_horaire),
  };
}
