import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DonneesRecu } from "@/lib/recu";

type Props = {
  recu: DonneesRecu | null;
  ouvert: boolean;
  onOuvertChange: (v: boolean) => void;
  enTete?: string;
};

/**
 * Reçu imprimable : à l'impression, seul le bloc `.zone-recu` reste visible
 * (règles définies dans src/styles.css).
 */
export function RecuImpression({ recu, ouvert, onOuvertChange, enTete }: Props) {
  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="no-print">
          <DialogTitle>Reçu d'opération</DialogTitle>
          <DialogDescription>
            Vérifiez les informations puis imprimez le reçu à remettre au client.
          </DialogDescription>
        </DialogHeader>

        {recu ? (
          <div className="zone-recu bg-card text-foreground rounded-md border p-4 text-sm">
            <div className="border-b pb-2 text-center">
              <p className="font-display text-base font-semibold">
                {enTete ?? "Épargne quotidienne"}
              </p>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">{recu.titre}</p>
            </div>

            <dl className="space-y-1.5 py-3">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Référence</dt>
                <dd className="montant">{recu.reference}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Date</dt>
                <dd>{recu.dateTexte}</dd>
              </div>
              {recu.lignes.map((l) => (
                <div key={l.label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{l.label}</dt>
                  <dd className="text-right">{l.valeur}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium">{recu.montantLibelle}</span>
              <span className="montant text-lg font-semibold">{recu.montantTexte}</span>
            </div>

            <div className="text-muted-foreground mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p>Signature client</p>
                <div className="mt-6 border-t" />
              </div>
              <div>
                <p>Signature caissier</p>
                <div className="mt-6 border-t" />
              </div>
            </div>

            <p className="text-muted-foreground mt-3 text-center text-[11px]">
              {recu.mention ?? "Reçu généré automatiquement — à conserver."}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground py-6 text-center text-sm">Chargement du reçu…</p>
        )}

        <DialogFooter className="no-print">
          <Button variant="outline" onClick={() => onOuvertChange(false)}>
            Fermer
          </Button>
          <Button onClick={() => window.print()} disabled={!recu}>
            <Printer className="mr-2 size-4" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
