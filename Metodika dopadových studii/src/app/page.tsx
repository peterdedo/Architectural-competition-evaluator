import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  trustHomepagePillars,
  TRUST_NUMBERS_FOOTNOTE,
} from "@/content/trust-framing-cs";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-20 text-center">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
            Studie dopadů strategických investic
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Jaký dopad bude mít vaše investice?
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Za pár minut získáte srozumitelný odhad: pracovní místa, bydlení,
            dopady na veřejné rozpočty a srovnání tří variant vývoje — bez
            studia metodické příručky.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="min-w-[220px]">
              <Link href="/studio">Začít vyplňovat záměr</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/report">Otevřít report</Link>
            </Button>
          </div>
          <p className="max-w-md text-center text-xs text-muted-foreground">
            Report se naplní až po dokončení průvodce a přepočtu — nejdřív
            použijte tlačítko výše.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-border/50 bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Jak to funguje
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What you get */}
      <div className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Co dostanete
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {outputs.map((o) => (
              <div
                key={o.label}
                className="rounded-lg border border-border/60 bg-card p-4 shadow-sm"
              >
                <p className="text-2xl">{o.icon}</p>
                <p className="mt-2 font-semibold text-foreground">{o.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proč tomu věřit — trust signals */}
      <div className="border-t border-border/50 bg-muted/20 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Proč výsledkům věřit
          </p>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Stejné principy potom uvidíte u výsledků a v reportu — jeden srozumitelný rámec.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {trustHomepagePillars.map((t) => (
              <div
                key={t.title}
                className="rounded-lg border border-border/60 bg-card p-5 shadow-sm"
              >
                <p className="mb-2 text-base font-semibold text-foreground">
                  {t.title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-border/40 px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          Průvodce obsahuje předvyplněná ukázková data — procházejte kroky nebo rovnou otevřete
          report. <span className="font-medium">{TRUST_NUMBERS_FOOTNOTE}</span> Každý výpočet
          ukazuje zdroj a míru nejistoty.
        </p>
      </div>
    </main>
  );
}

const steps = [
  {
    title: "Zadejte záměr",
    body: "Vyplňte základní údaje o projektu: kdo investuje, kde, jak velká investice a kolik pracovních míst plánujete.",
  },
  {
    title: "Nástroj spočítá dopady",
    body: "Z vašich vstupů vznikne odhad dopadů na zaměstnanost, bydlení, občanskou vybavenost a veřejné finance — ve třech variantách vývoje.",
  },
  {
    title: "Rozhodněte a sdílejte",
    body: "Dostanete přehledné shrnutí pro vedení, tisknutelný report a možnost stáhnout data pro archiv nebo další práci.",
  },
];

const outputs = [
  {
    icon: "👷",
    label: "Pracovní místa",
    desc: "Přímá i navazující zaměstnanost v regionu",
  },
  {
    icon: "🏠",
    label: "Bydlení a obyvatelé",
    desc: "Odhad počtu nových obyvatel a bytů potřebných k usazení",
  },
  {
    icon: "📊",
    label: "Tři scénáře",
    desc: "Optimistický, střední a pesimistický vývoj s porovnáním",
  },
  {
    icon: "🏛️",
    label: "Dopady na rozpočty",
    desc: "Orientační vliv na daňové výnosy a podíl pro obce ze sdílených daní",
  },
];

