import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, CircleDollarSign, Activity } from "lucide-react";
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
import { EtatChargement, EtatErreur } from "@/components/commun/Etats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import { formaterMontant, formaterNombre, aujourdhui } from "@/lib/format";
import {
  agregerActivite,
  intervalleDashboard,
  toutesLesPages,
  type PeriodeDashboard,
} from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord dynamique — Mboa Credit Union" },
      {
        name: "description",
        content:
          "Suivi graphique des collectes, retraits, carnets et remises de caisse par période.",
      },
      { property: "og:title", content: "Tableau de bord dynamique — Mboa Credit Union" },
      {
        property: "og:description",
        content: "Activité financière et situation des carnets avec graphiques interactifs.",
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
  const [periode, setPeriode] = useState<PeriodeDashboard>("annee");
  const [mois, setMois] = useState(jour.slice(0, 7));
  const [mode, setMode] = useState("montant");
  const [series, setSeries] = useState({ collecte: true, retrait: true, vente: true });
  const intervalle = intervalleDashboard(periode, mois, jour);
  const requete = useQuery({
    queryKey: [
      "tableau-de-bord",
      profil?.id_utilisateur,
      roles.join(","),
      intervalle.debut,
      intervalle.fin,
    ],
    enabled: Boolean(profil),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const [epargnants, livrets, stock, operations, remises] = await Promise.all([
        supabase.from("epargnant").select("id_epargnant", { count: "exact", head: true }),
        toutesLesPages((debut, fin) =>
          supabase.from("livret").select("statut").order("id_livret").range(debut, fin),
        ),
        aRole("ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE")
          ? supabase.from("v_stock_agence").select("*")
          : Promise.resolve({ data: [], error: null }),
        toutesLesPages((debut, fin) =>
          supabase
            .from("operation")
            .select("code_type, montant, date_operation")
            .gte("date_operation", intervalle.debut)
            .lte("date_operation", intervalle.fin)
            .eq("statut", "VALIDEE")
            .order("id_operation")
            .range(debut, fin),
        ),
        toutesLesPages((debut, fin) =>
          supabase
            .from("remise_caisse")
            .select("statut, ecart")
            .gte("date_remise", intervalle.debut)
            .lte("date_remise", intervalle.fin)
            .order("id_remise")
            .range(debut, fin),
        ),
      ]);
      if (epargnants.error || stock.error) throw epargnants.error || stock.error;
      return {
        nbEpargnants: epargnants.count ?? 0,
        livrets,
        stock: stock.data ?? [],
        operations,
        remises,
      };
    },
  });
  if (!profil)
    return (
      <EtatErreur erreur={new Error("Votre compte n'est pas rattaché à un profil utilisateur.")} />
    );
  const d = requete.data;
  const nombre = mode === "nombre";
  const mensuel = periode === "annee";
  const activite = agregerActivite(
    d?.operations ?? [],
    intervalle.debut,
    intervalle.fin,
    mensuel,
    nombre,
  );
  const valeur = (n: number) => (nombre ? formaterNombre(n) : formaterMontant(n, config));
  const totalType = (type: string) =>
    (d?.operations ?? [])
      .filter((o) => o.code_type === type)
      .reduce((t, o) => t + (nombre ? 1 : Number(o.montant)), 0);
  const repartition = [
    { type: "collectes", montant: totalType("COLLECTE"), fill: "var(--color-collectes)" },
    { type: "retraits", montant: totalType("RETRAIT"), fill: "var(--color-retraits)" },
    { type: "ventes", montant: totalType("ACHAT_CARNET"), fill: "var(--color-ventes)" },
  ];
  const total = repartition.reduce((t, o) => t + o.montant, 0);
  const livrets = Object.entries(livretsConfig).map(([statut, item]) => ({
    statut,
    nombre: d?.livrets.filter((l) => l.statut === statut).length ?? 0,
    fill: item.color,
  }));
  const remises = [
    {
      statut: "Validées sans écart",
      nombre:
        d?.remises.filter((r) => r.statut === "VALIDEE" && Number(r.ecart ?? 0) === 0).length ?? 0,
      fill: "var(--color-validees)",
    },
    {
      statut: "En attente",
      nombre: d?.remises.filter((r) => r.statut !== "VALIDEE").length ?? 0,
      fill: "var(--color-attente)",
    },
    {
      statut: "Validées avec écart",
      nombre:
        d?.remises.filter((r) => r.statut === "VALIDEE" && Number(r.ecart ?? 0) !== 0).length ?? 0,
      fill: "var(--color-ecart)",
    },
  ];
  return (
    <>
      <EnTetePage
        titre="Tableau de bord"
        description={`${profil.agence?.nom ?? "Toutes les agences autorisées"} · Bonjour ${profil.prenom || profil.nom}`}
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periode} onValueChange={(v) => setPeriode(v as PeriodeDashboard)}>
            <SelectTrigger aria-label="Période" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
              <SelectItem value="annee">Cette année</SelectItem>
              <SelectItem value="mois">Choisir un mois</SelectItem>
            </SelectContent>
          </Select>
          {periode === "mois" && (
            <Input
              type="month"
              aria-label="Mois"
              min="2000-01"
              max={jour.slice(0, 7)}
              value={mois}
              className="w-44"
              onChange={(e) => {
                if (
                  /^\d{4}-\d{2}$/.test(e.target.value) &&
                  e.target.value <= jour.slice(0, 7) &&
                  e.target.value >= "2000-01"
                )
                  setMois(e.target.value);
              }}
            />
          )}
          <div role="group" aria-label="Mesure des graphiques" className="flex gap-1 border-l pl-2">
            <Button
              variant={nombre ? "ghost" : "secondary"}
              size="sm"
              aria-pressed={!nombre}
              onClick={() => setMode("montant")}
            >
              Montants
            </Button>
            <Button
              variant={nombre ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={nombre}
              onClick={() => setMode("nombre")}
            >
              Nombre
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {requete.isFetching
              ? "Actualisation…"
              : requete.dataUpdatedAt
                ? `À jour à ${new Date(requete.dataUpdatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
          </span>
          <Button
            size="icon"
            variant="outline"
            title="Actualiser les graphiques"
            aria-label="Actualiser les graphiques"
            disabled={requete.isFetching}
            onClick={() => void requete.refetch()}
          >
            <RefreshCw
              className={requete.isFetching ? "animate-spin motion-reduce:animate-none" : ""}
            />
          </Button>
        </div>
      </div>
      {requete.isLoading ? (
        <EtatChargement />
      ) : requete.error ? (
        <EtatErreur erreur={requete.error} />
      ) : (
        <>
          <section aria-label="Activité financière" className="min-w-0">
            <div className="mb-4 flex flex-wrap justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <h2 className="font-semibold">Évolution de l’activité</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {intervalle.debut.split("-").reverse().join("/")} —{" "}
                  {intervalle.fin.split("-").reverse().join("/")} · Opérations validées
                </p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Séries visibles">
                {(["collecte", "retrait", "vente"] as const).map((cle) => (
                  <Button
                    key={cle}
                    variant={series[cle] ? "secondary" : "ghost"}
                    size="sm"
                    aria-pressed={series[cle]}
                    onClick={() => setSeries((s) => ({ ...s, [cle]: !s[cle] }))}
                  >
                    <span
                      className={`size-2 rounded-full ${cle === "collecte" ? "bg-chart-1" : cle === "retrait" ? "bg-chart-5" : "bg-chart-3"}`}
                    />
                    {activiteConfig[cle].label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-x-8 gap-y-3">
              {repartition.map((item) => (
                <div key={item.type}>
                  <p className="text-xs text-muted-foreground">
                    {operationsConfig[item.type as keyof typeof operationsConfig].label}
                  </p>
                  <p className="montant mt-1 text-lg font-semibold">{valeur(item.montant)}</p>
                </div>
              ))}
            </div>
            <ChartContainer
              config={activiteConfig}
              className="h-80 w-full aspect-auto"
              aria-label="Évolution des collectes, retraits et ventes"
            >
              <AreaChart data={activite} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                  tickFormatter={(v) =>
                    mensuel
                      ? new Date(`${v}-01T12:00:00`).toLocaleDateString("fr-FR", { month: "short" })
                      : `${v.slice(8, 10)}/${v.slice(5, 7)}`
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  allowDecimals={false}
                  tickFormatter={abregerMontant}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) =>
                        String(payload?.[0]?.payload.date ?? "")
                          .split("-")
                          .reverse()
                          .join("/")
                      }
                      formatter={(v, nom) => (
                        <LigneInfobulle
                          libelle={String(
                            activiteConfig[String(nom) as keyof typeof activiteConfig]?.label ??
                              nom,
                          )}
                          valeur={valeur(Number(v))}
                        />
                      )}
                    />
                  }
                />
                {(["collecte", "retrait", "vente"] as const)
                  .filter((cle) => series[cle])
                  .map((cle) => (
                    <Area
                      key={cle}
                      dataKey={cle}
                      type="monotone"
                      stroke={`var(--color-${cle})`}
                      fill={`var(--color-${cle})`}
                      fillOpacity={0.1}
                      strokeWidth={2.5}
                      isAnimationActive={false}
                    />
                  ))}
              </AreaChart>
            </ChartContainer>
            {total === 0 && (
              <p className="py-2 text-center text-sm text-muted-foreground">
                Aucune opération validée sur cette période.
              </p>
            )}
          </section>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SectionGraphique
              titre="Répartition des opérations"
              description={`${valeur(total)} · ${nombre ? "Nombre d’opérations" : "Montants cumulés"}`}
            >
              {total > 0 ? (
                <ChartContainer config={operationsConfig} className="h-64 w-full aspect-auto">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          hideLabel
                          nameKey="type"
                          formatter={(v, nom) => (
                            <LigneInfobulle
                              libelle={String(
                                operationsConfig[String(nom) as keyof typeof operationsConfig]
                                  ?.label ?? nom,
                              )}
                              valeur={valeur(Number(v))}
                            />
                          )}
                        />
                      }
                    />
                    <Pie
                      data={repartition.filter((i) => i.montant > 0)}
                      dataKey="montant"
                      nameKey="type"
                      innerRadius={62}
                      outerRadius={90}
                      paddingAngle={3}
                      isAnimationActive={false}
                    >
                      {repartition
                        .filter((i) => i.montant > 0)
                        .map((i) => (
                          <Cell key={i.type} fill={i.fill} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="type" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <EtatVide message="Aucune opération validée sur cette période." />
              )}
            </SectionGraphique>
            <SectionGraphique
              titre="Situation des livrets"
              description={`${formaterNombre(d?.nbEpargnants)} épargnants · ${formaterNombre(d?.livrets.length)} livrets au total · Situation actuelle`}
            >
              <ChartContainer config={livretsConfig} className="h-64 w-full aspect-auto">
                <BarChart data={livrets} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="statut"
                    width={80}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      livretsConfig[v as keyof typeof livretsConfig]?.label ?? v
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="statut" />} />
                  <Bar dataKey="nombre" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    {livrets.map((i) => (
                      <Cell key={i.statut} fill={i.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </SectionGraphique>
            <SectionGraphique
              titre="Remises de caisse"
              description={`${formaterNombre(d?.remises.length)} remises · ${formaterMontant(
                d?.remises.reduce(
                  (t, r) => t + (r.statut === "VALIDEE" ? Number(r.ecart ?? 0) : 0),
                  0,
                ),
                config,
              )} d’écart cumulé`}
            >
              {d?.remises.length ? (
                <ChartContainer config={remisesConfig} className="h-64 w-full aspect-auto">
                  <BarChart data={remises} layout="vertical">
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                    <YAxis
                      dataKey="statut"
                      type="category"
                      width={126}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="nombre" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {remises.map((i) => (
                        <Cell key={i.statut} fill={i.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              ) : (
                <EtatVide message="Aucune remise sur cette période." />
              )}
            </SectionGraphique>
            {aRole("ADMINISTRATEUR", "DIRECTION", "RESPONSABLE_AGENCE") && (
              <SectionGraphique
                titre="Stock par agence"
                description="Situation actuelle des carnets"
              >
                <ChartContainer config={stockConfig} className="h-64 w-full aspect-auto">
                  <BarChart
                    data={(d?.stock ?? []).map((s) => ({
                      agence: s.nom,
                      disponibles: s.disponible,
                      actifs: s.actif,
                      bloques: s.bloque,
                      clotures: s.cloture,
                      attribues: s.attribue,
                      perdus: s.perdu,
                    }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="agence" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} width={32} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent className="flex-wrap" />} />
                    {Object.keys(stockConfig).map((cle) => (
                      <Bar
                        key={cle}
                        dataKey={cle}
                        stackId="stock"
                        fill={`var(--color-${cle})`}
                        isAnimationActive={false}
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              </SectionGraphique>
            )}
          </div>
        </>
      )}
    </>
  );
}

const livretsConfig = {
  EN_STOCK: { label: "En stock", color: "var(--chart-2)" },
  ATTRIBUE: { label: "Attribués", color: "var(--chart-4)" },
  ACTIF: { label: "Actifs", color: "var(--chart-1)" },
  BLOQUE: { label: "Bloqués", color: "var(--chart-3)" },
  CLOTURE: { label: "Clôturés", color: "var(--chart-5)" },
  PERDU: { label: "Perdus", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const activiteConfig = {
  collecte: { label: "Collectes", color: "var(--chart-1)" },
  retrait: { label: "Retraits", color: "var(--chart-5)" },
  vente: { label: "Ventes", color: "var(--chart-3)" },
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
  attribues: { label: "Attribués", color: "var(--chart-4)" },
  perdus: { label: "Perdus", color: "var(--muted-foreground)" },
  disponibles: { label: "Disponibles", color: "var(--chart-2)" },
  actifs: { label: "Actifs", color: "var(--chart-1)" },
  bloques: { label: "Bloqués", color: "var(--chart-3)" },
  clotures: { label: "Clôturés", color: "var(--chart-5)" },
} satisfies ChartConfig;

function SectionGraphique({
  titre,
  description,
  children,
}: {
  titre: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden border-t pt-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b px-4 py-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{titre}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <CircleDollarSign className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

function EtatVide({ message }: { message: string }) {
  return (
    <div className="grid h-64 place-items-center px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
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
