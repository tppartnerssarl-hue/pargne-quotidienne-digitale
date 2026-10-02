import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  HandCoins,
  Banknote,
  Boxes,
  CircleDollarSign,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { EnTetePage } from "@/components/commun/EnTetePage";
import { CarteStat } from "@/components/commun/CarteStat";
import { EtatChargement, EtatErreur } from "@/components/commun/Etats";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuth } from "@/hooks/useAuth";
import { useConfiguration } from "@/hooks/useConfiguration";
import { formaterMontant, formaterNombre, aujourdhui, debutDuMois } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Épargne quotidienne" },
      {
        name: "description",
        content:
          "Indicateurs du jour et du mois : collectes, retraits, livrets, stock et situation de caisse.",
      },
      { property: "og:title", content: "Tableau de bord — Épargne quotidienne" },
      {
        property: "og:description",
        content: "Collectes, retraits, livrets et caisse en un coup d'œil.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PageTableauDeBord,
});

function PageTableauDeBord() {
  const { profil, roles, aRole } = useAuth();
  const config = useConfiguration();
  const jour = aujourdhui();
  const debut = debutDuMois();

  const requete = useQuery({
    queryKey: ["tableau-de-bord", profil?.id_utilisateur, roles.join(",")],
    enabled: Boolean(profil),
    queryFn: async () => {
      const [epargnants, livrets, stock, operations, remises] = await Promise.all([
        supabase.from("epargnant").select("id_epargnant", { count: "exact", head: true }),
        supabase.from("livret").select("statut"),
        supabase.from("v_stock_agence").select("*"),
        supabase
          .from("operation")
          .select("code_type, montant, date_operation, statut")
          .gte("date_operation", debut)
          .eq("statut", "VALIDEE"),
        supabase.from("remise_caisse").select("statut, ecart, montant_declare"),
      ]);

      const erreur =
        epargnants.error || livrets.error || stock.error || operations.error || remises.error;
      if (erreur) throw erreur;

      const ops = operations.data ?? [];
      const somme = (type: string, duJour: boolean) =>
        ops
          .filter((o) => o.code_type === type && (!duJour || o.date_operation === jour))
          .reduce((t, o) => t + Number(o.montant), 0);

      const parStatut = (statut: string) =>
        (livrets.data ?? []).filter((l) => l.statut === statut).length;

      const nombreJours = new Date().getDate();
      const activite = Array.from({ length: nombreJours }, (_, index) => {
        const numeroJour = index + 1;
        const date = `${debut.slice(0, 8)}${String(numeroJour).padStart(2, "0")}`;
        const operationsDuJour = ops.filter((operation) => operation.date_operation === date);
        const total = (type: string) =>
          operationsDuJour
            .filter((operation) => operation.code_type === type)
            .reduce((sousTotal, operation) => sousTotal + Number(operation.montant), 0);

        return { jour: String(numeroJour), collecte: total("COLLECTE"), retrait: total("RETRAIT") };
      });

      const remisesData = remises.data ?? [];

      return {
        nbEpargnants: epargnants.count ?? 0,
        nbLivrets: (livrets.data ?? []).length,
        disponibles: parStatut("EN_STOCK"),
        actifs: parStatut("ACTIF"),
        collecteJour: somme("COLLECTE", true),
        collecteMois: somme("COLLECTE", false),
        retraitJour: somme("RETRAIT", true),
        retraitMois: somme("RETRAIT", false),
        venteMois: somme("ACHAT_CARNET", false),
        activite,
        stock: stock.data ?? [],
        remisesEnAttente: remisesData.filter((r) => r.statut !== "VALIDEE").length,
        remisesValidees: remisesData.filter((r) => r.statut === "VALIDEE").length,
        remisesAvecEcart: remisesData.filter(
          (r) => r.statut === "VALIDEE" && Number(r.ecart ?? 0) !== 0,
        ).length,
        ecartTotal: remisesData
          .filter((r) => r.statut === "VALIDEE")
          .reduce((t, r) => t + Number(r.ecart ?? 0), 0),
      };
    },
  });

  if (!profil) {
    return (
      <div className="surface-card p-6">
        <h2 className="font-semibold">Compte non rattaché</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Votre compte de connexion n'est rattaché à aucun profil utilisateur. Contactez un
          administrateur pour qu'il crée votre profil avec votre adresse email.
        </p>
      </div>
    );
  }

  if (requete.isLoading) return <EtatChargement />;
  if (requete.error) return <EtatErreur erreur={requete.error} />;
  const d = requete.data;
  if (!d) return <EtatErreur erreur={new Error("Les indicateurs sont indisponibles.")} />;

  const repartitionOperations = [
    { type: "collectes", montant: d.collecteMois, fill: "var(--color-collectes)" },
    { type: "retraits", montant: d.retraitMois, fill: "var(--color-retraits)" },
    { type: "ventes", montant: d.venteMois, fill: "var(--color-ventes)" },
  ];
  const totalOperations = repartitionOperations.reduce((total, item) => total + item.montant, 0);
  const remisesGraphique = [
    { statut: "Validées", nombre: d.remisesValidees, fill: "var(--color-validees)" },
    { statut: "En attente", nombre: d.remisesEnAttente, fill: "var(--color-attente)" },
    { statut: "Avec écart", nombre: d.remisesAvecEcart, fill: "var(--color-ecart)" },
  ];
  const stockGraphique = d.stock.map((stockAgence: Record<string, unknown>) => ({
    agence: String(stockAgence["nom"] ?? "Agence"),
    disponibles: Number(stockAgence["disponible"] ?? 0),
    actifs: Number(stockAgence["actif"] ?? 0),
    bloques: Number(stockAgence["bloque"] ?? 0),
    clotures: Number(stockAgence["cloture"] ?? 0),
  }));

  return (
    <>
      <EnTetePage
        titre={`Bonjour ${profil.prenom || profil.nom}`}
        description={
          profil.agence
            ? `${profil.agence.nom} — données du ${new Date().toLocaleDateString("fr-FR")}`
            : "Vue consolidée de toutes les agences"
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CarteStat
          libelle="Collectes du jour"
          valeur={formaterMontant(d.collecteJour, config)}
          detail={`Mois : ${formaterMontant(d.collecteMois, config)}`}
          icone={HandCoins}
          accent
        />
        <CarteStat
          libelle="Retraits du jour"
          valeur={formaterMontant(d.retraitJour, config)}
          detail={`Mois : ${formaterMontant(d.retraitMois, config)}`}
          icone={Banknote}
        />
        <CarteStat
          libelle="Épargnants"
          valeur={formaterNombre(d.nbEpargnants)}
          detail={`${formaterNombre(d.actifs)} livrets actifs`}
          icone={Users}
        />
        <CarteStat
          libelle="Livrets disponibles"
          valeur={formaterNombre(d.disponibles)}
          detail={`${formaterNombre(d.nbLivrets)} livrets au total`}
          icone={Boxes}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <SectionGraphique
          titre="Activité du mois"
          description="Évolution quotidienne des mouvements validés"
        >
          {d.activite.some((point) => point.collecte > 0 || point.retrait > 0) ? (
            <ChartContainer config={activiteConfig} className="h-72 w-full aspect-auto">
              <AreaChart data={d.activite} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectes-remplissage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-collecte)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-collecte)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="retraits-remplissage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-retrait)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-retrait)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="jour" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={abregerMontant}
                />
                <ChartTooltip content={<ChartTooltipContent formatter={(valeur, nom) => (
                  <LigneInfobulle libelle={String(nom)} valeur={formaterMontant(Number(valeur), config)} />
                )} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area dataKey="collecte" type="monotone" stroke="var(--color-collecte)" fill="url(#collectes-remplissage)" strokeWidth={2} />
                <Area dataKey="retrait" type="monotone" stroke="var(--color-retrait)" fill="url(#retraits-remplissage)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          ) : <EtatVide message="Aucun mouvement validé ce mois-ci." />}
        </SectionGraphique>

        <SectionGraphique titre="Répartition du mois" description="Poids financier de chaque opération">
          {totalOperations > 0 ? (
            <div className="relative">
              <ChartContainer config={operationsConfig} className="mx-auto h-72 w-full max-w-md aspect-auto">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="type" formatter={(valeur, nom) => (
                    <LigneInfobulle libelle={String(nom)} valeur={formaterMontant(Number(valeur), config)} />
                  )} />} />
                  <Pie data={repartitionOperations} dataKey="montant" nameKey="type" innerRadius={62} outerRadius={92} paddingAngle={3}>
                    {repartitionOperations.map((item) => <Cell key={item.type} fill={item.fill} />)}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="type" />} />
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-x-0 top-[6.1rem] text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="montant mt-1 text-sm font-semibold">{formaterMontant(totalOperations, config)}</p>
              </div>
            </div>
          ) : <EtatVide message="Aucune opération validée ce mois-ci." />}
        </SectionGraphique>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.65fr)]">
        <SectionGraphique titre="Remises de caisse" description={`${formaterMontant(d.ecartTotal, config)} d'écart cumulé`}>
          {remisesGraphique.some((item) => item.nombre > 0) ? (
            <ChartContainer config={remisesConfig} className="h-64 w-full aspect-auto">
              <BarChart data={remisesGraphique} layout="vertical" margin={{ left: 12, right: 20 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis dataKey="statut" type="category" tickLine={false} axisLine={false} width={78} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="nombre" radius={[0, 4, 4, 0]}>
                  {remisesGraphique.map((item) => <Cell key={item.statut} fill={item.fill} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : <EtatVide message="Aucune remise de caisse enregistrée." />}
        </SectionGraphique>

        {aRole("ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE") ? (
          <SectionGraphique titre="Stock de livrets par agence" description="Disponibilité et utilisation des carnets">
            {stockGraphique.length > 0 ? (
              <ChartContainer config={stockConfig} className="h-64 w-full aspect-auto">
                <BarChart data={stockGraphique} margin={{ left: 0, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="agence" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="disponibles" stackId="stock" fill="var(--color-disponibles)" radius={[0, 0, 3, 3]} />
                  <Bar dataKey="actifs" stackId="stock" fill="var(--color-actifs)" />
                  <Bar dataKey="bloques" stackId="stock" fill="var(--color-bloques)" />
                  <Bar dataKey="clotures" stackId="stock" fill="var(--color-clotures)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : <EtatVide message="Aucun stock d'agence disponible." />}
          </SectionGraphique>
        ) : null}
      </div>
    </>
  );
}

const activiteConfig = {
  collecte: { label: "Collectes", color: "var(--chart-1)" },
  retrait: { label: "Retraits", color: "var(--chart-5)" },
} satisfies ChartConfig;

const operationsConfig = {
  collectes: { label: "Collectes", color: "var(--chart-1)" },
  retraits: { label: "Retraits", color: "var(--chart-5)" },
  ventes: { label: "Ventes", color: "var(--chart-3)" },
} satisfies ChartConfig;

const remisesConfig = {
  nombre: { label: "Nombre", color: "var(--chart-1)" },
  validees: { label: "Validées", color: "var(--chart-1)" },
  attente: { label: "En attente", color: "var(--chart-3)" },
  ecart: { label: "Avec écart", color: "var(--chart-5)" },
} satisfies ChartConfig;

const stockConfig = {
  disponibles: { label: "Disponibles", color: "var(--chart-2)" },
  actifs: { label: "Actifs", color: "var(--chart-1)" },
  bloques: { label: "Bloqués", color: "var(--chart-3)" },
  clotures: { label: "Clôturés", color: "var(--chart-5)" },
} satisfies ChartConfig;

function SectionGraphique({ titre, description, children }: { titre: string; description: string; children: React.ReactNode }) {
  return (
    <section className="surface-card min-w-0 overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b px-4 py-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{titre}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <CircleDollarSign className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function EtatVide({ message }: { message: string }) {
  return <div className="grid h-64 place-items-center px-4 text-center text-sm text-muted-foreground">{message}</div>;
}

function LigneInfobulle({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex min-w-44 items-center justify-between gap-4">
      <span className="text-muted-foreground">{libelle}</span>
      <span className="montant font-medium text-foreground">{valeur}</span>
    </div>
  );
}

function abregerMontant(valeur: number) {
  if (Math.abs(valeur) >= 1_000_000) return `${Math.round(valeur / 1_000_000)} M`;
  if (Math.abs(valeur) >= 1_000) return `${Math.round(valeur / 1_000)} k`;
  return String(valeur);
}
