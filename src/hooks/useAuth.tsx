import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { CodeRole } from "@/lib/constantes";

export type Profil = {
  id_utilisateur: string;
  id_agence: string | null;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  statut: string;
  agence?: { code: string; nom: string } | null;
};

type AuthContexte = {
  user: User | null;
  session: Session | null;
  profil: Profil | null;
  roles: CodeRole[];
  chargement: boolean;
  aRole: (...codes: CodeRole[]) => boolean;
  rafraichir: () => Promise<void>;
  deconnexion: () => Promise<void>;
};

const Contexte = createContext<AuthContexte | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  const [roles, setRoles] = useState<CodeRole[]>([]);
  const [chargement, setChargement] = useState(true);

  const chargerProfil = async (userId: string | undefined) => {
    if (!userId) {
      setProfil(null);
      setRoles([]);
      return;
    }
    const { data } = await supabase
      .from("utilisateur")
      .select(
        "id_utilisateur, id_agence, nom, prenom, email, telephone, statut, agence:agence(code, nom)",
      )
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!data) {
      setProfil(null);
      setRoles([]);
      return;
    }
    setProfil(data as unknown as Profil);

    const { data: liens } = await supabase
      .from("utilisateur_role")
      .select("role:role(code)")
      .eq("id_utilisateur", data.id_utilisateur);

    setRoles(
      ((liens ?? []) as unknown as { role: { code: CodeRole } | null }[])
        .map((l) => l.role?.code)
        .filter(Boolean) as CodeRole[],
    );
  };

  useEffect(() => {
    let actif = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!actif) return;
      setSession(s);
      if (event === "SIGNED_OUT") {
        setProfil(null);
        setRoles([]);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setTimeout(() => void chargerProfil(s?.user.id), 0);
      }
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!actif) return;
      setSession(data.session);
      await chargerProfil(data.session?.user.id);
      setChargement(false);
    })();

    return () => {
      actif = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const valeur: AuthContexte = {
    user: session?.user ?? null,
    session,
    profil,
    roles,
    chargement,
    aRole: (...codes) => codes.some((c) => roles.includes(c)),
    rafraichir: async () => {
      const { data } = await supabase.auth.getSession();
      await chargerProfil(data.session?.user.id);
    },
    deconnexion: async () => {
      await supabase.auth.signOut();
      setProfil(null);
      setRoles([]);
    },
  };

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth() {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
