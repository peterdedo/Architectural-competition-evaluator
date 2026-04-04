/**
 * Jednotná „trust“ vrstva: stejná logika a slovník (homepage, výsledky, report, OQ).
 * Čtyři úrovně mají odlišný význam i dopad na rozhodnutí — žádné vágní překryvy.
 */

export type TrustLevel = "stable" | "moderate" | "sensitive" | "uncertain";

/** Tři body: co to znamená → kdy tomu věřit → kdy být opatrný */
export type TrustDecisionBullets = readonly [string, string, string];

export type TrustFraming = {
  level: TrustLevel;
  summary: string;
  detail: string;
  documentExtra: string | null;
  decisionBullets: TrustDecisionBullets;
};

export const TRUST_SCENARIOS_PRIMARY =
  "Optimistický, střední a pesimistický scénář jsou tři varianty předpokladů — nejsou to rozmezí jistoty ani pravděpodobnostní pásma.";

export const TRUST_SCENARIOS_SECONDARY =
  "Každý scénář používá jiné hodnoty klíčových parametrů. Rozdíl mezi nejpříznivější a nejméně příznivou variantou ukazuje, jak moc je odhad citlivý na to, co zvolíte jako předpoklad.";

export const TRUST_OQ_PRIMARY =
  "Nejde o chybu výpočtu — jde o oblasti, kde metodika zatím nemá jednoznačnou odpověď.";

export const TRUST_OQ_DECISION =
  "U položek níže počítejte s vyšší nejistotou a ověřte je s místní znalostí nebo odborníkem.";

/** Jedna věta: nástroj nehodnotí „dobrý/špatný“ záměr */
export const TRUST_DECISION_NEUTRAL =
  "Aplikace nehodnotí, zda je záměr správný — jen odhaduje měřitelné dopady z vámi zadaných údajů.";

/** Mikrotext proti falešné přesnosti — všude stejně */
export const TRUST_NUMBERS_FOOTNOTE =
  "Všechna čísla jsou orientační odhady z modelu, ne ověřené účetní ani statistické údaje.";

const STABLE: Omit<TrustFraming, "level"> = {
  summary: "Podklad je v rámci nástroje úplný",
  detail:
    "Chybí upozornění i otevřené otázky metodiky. To znamená konzistentní výpočet pro zadané vstupy — ne jistotu v právním ani auditorském smyslu.",
  documentExtra:
    "Dokument můžete použít jako jeden z podkladů k jednání, pokud odpovídá realitě vstupů.",
  decisionBullets: [
    "Co to znamená: souhrn dopadů (zaměstnanost, lidé, finance) pro střední scénář odpovídá zadaným předpokladům bez výhrad nástroje.",
    "Kdy tomu věřit: když důvěřujete svým vstupům a berete výstup jako orientační model, ne jako fakt.",
    "Kdy být opatrný: při závazných rozhodnutích vždy doplňte vlastní data a kontext — model nezná všechny lokální podmínky.",
  ],
};

/** Bezpečný výchozí texty pro rozhodovací odrážky (stale bundle / rozbitý stav). */
export const TRUST_DECISION_BULLETS_FALLBACK: TrustDecisionBullets =
  STABLE.decisionBullets as TrustDecisionBullets;

const MODERATE = (parts: string[]): Omit<TrustFraming, "level"> => ({
  summary: "Jsou zde výhrady — projděte je",
  detail:
    parts.length > 0
      ? `${parts.join(" ")} Celkový obrázek použijte opatrně; detaily jsou u předpokladů a upozornění.`
      : "Menší výhrady nemění hlavní směr odhadu, ale měly by být přečteny.",
  documentExtra:
    parts.length > 0
      ? "Před závěrem v dokumentu otevřete sekci předpokladů a upozornění."
      : null,
  decisionBullets: [
    "Co to znamená: hlavní čísla platí, ale nástroj explicitně upozorňuje na konkrétní slabiny nebo neuzavřené části metodiky.",
    "Kdy tomu věřit: pro předběžnou přípravu jednání a směr dopadů — pokud výhrady nepřekvapí vaši expertizu.",
    "Kdy být opatrný: nepřeskakujte seznam upozornění a otevřených otázek; mohou měnit interpretaci čísel.",
  ],
});

const SENSITIVE = (items: string): Omit<TrustFraming, "level"> => ({
  summary: "Odhad silně závisí na předpokladech",
  detail: `Kombinace signálů (${items}) ukazuje, že výsledek se mění podle toho, co zvolíte. Před rozhodnutím ověřte klíčové vstupy.`,
  documentExtra:
    "V dokumentu porovnejte všechny tři scénáře a sekci předpokladů — jedno číslo nestačí.",
  decisionBullets: [
    "Co to znamená: stejný záměr může podle variant předpokladů vypadat výrazně jinak — tabulka scénářů je nutná, ne volitelná.",
    "Kdy tomu věřit: jako rozmezí možností po ověření nejkřiklavějších předpokladů s odborníky nebo daty z území.",
    "Kdy být opatrný: při jedném čísle nebo jednom scénáři — riziko podcenění nejistoty.",
  ],
});

const UNCERTAIN: Omit<TrustFraming, "level"> = {
  summary: "Podklad je slabý pro samostatné rozhodnutí",
  detail:
    "Velký počet upozornění a otevřených otázek znamená, že model hodně doplňuje nebo neví. Výstup použijte jen jako hrubý nástin.",
  documentExtra:
    "Pro závazný krok je potřeba další analýza, data nebo posudek mimo tento nástroj.",
  decisionBullets: [
    "Co to znamená: nástroj sám signalizuje, že podklad má příliš mnoho děr — nelze z něj „vyčíst“ jednoznačný závěr.",
    "Kdy tomu věřit: téměř jen jako kontrolní seznam otázek k doplnění, ne jako podklad pro finální ANO/NE.",
    "Kdy být opatrný: vždy — dokud nezredukujete počet výhrad změnou vstupů nebo externím podkladem.",
  ],
};

/** Proti stale HMR / rozštěpeným chunkům, kde `decisionBullets` chybí. */
function ensureTrustDecisionBullets(
  bullets: TrustDecisionBullets | readonly string[] | undefined | null,
): TrustDecisionBullets {
  if (
    bullets != null &&
    Array.isArray(bullets) &&
    bullets.length === 3 &&
    bullets.every((x) => typeof x === "string")
  ) {
    return bullets as unknown as TrustDecisionBullets;
  }
  return TRUST_DECISION_BULLETS_FALLBACK;
}

function computeTrustFraming(
  warningCount: number,
  openQuestionCount: number,
  varyingAssumptionKeyCount: number,
): TrustFraming {
  if (
    warningCount === 0 &&
    openQuestionCount === 0 &&
    varyingAssumptionKeyCount <= 1
  ) {
    return { level: "stable", ...STABLE };
  }

  if (warningCount >= 5 && openQuestionCount >= 3) {
    return { level: "uncertain", ...UNCERTAIN };
  }

  if (
    warningCount >= 3 ||
    openQuestionCount >= 3 ||
    varyingAssumptionKeyCount >= 4
  ) {
    const bits = [
      warningCount >= 3 ? `${warningCount} upozornění` : null,
      openQuestionCount >= 3 ? `${openQuestionCount} otevřených otázek` : null,
      varyingAssumptionKeyCount >= 4
        ? `${varyingAssumptionKeyCount} parametrů se liší mezi scénáři`
        : null,
    ].filter(Boolean) as string[];
    return {
      level: "sensitive",
      ...SENSITIVE(bits.join(", ")),
    };
  }

  const modParts: string[] = [];
  if (warningCount > 0) {
    modParts.push(`${warningCount} upozornění.`);
  }
  if (openQuestionCount > 0) {
    modParts.push(`${openQuestionCount} otevřených otázek metodiky.`);
  }
  if (varyingAssumptionKeyCount > 1) {
    modParts.push(
      `${varyingAssumptionKeyCount} parametrů se liší mezi scénáři.`,
    );
  }

  return {
    level: "moderate",
    ...MODERATE(modParts),
  };
}

export function resolveTrustFraming(
  warningCount: number,
  openQuestionCount: number,
  varyingAssumptionKeyCount: number,
): TrustFraming {
  const out = computeTrustFraming(
    warningCount,
    openQuestionCount,
    varyingAssumptionKeyCount,
  );
  return {
    ...out,
    decisionBullets: ensureTrustDecisionBullets(out.decisionBullets),
  };
}

export const trustHomepagePillars: { title: string; body: string }[] = [
  {
    title: "Vidíte, z čeho čísla vycházejí",
    body: "Předpoklady a výhrady jsou u výsledků vidět — stejná logika v průvodci i v reportu.",
  },
  {
    title: "Čtyři úrovně podkladu",
    body: "Od „úplný v rámci nástroje“ až po „slabý pro samostatné rozhodnutí“ — vždy víte, jak vážně čísla brát.",
  },
  {
    title: "Tři varianty vývoje, ne jedno číslo",
    body: `${TRUST_SCENARIOS_PRIMARY} ${TRUST_SCENARIOS_SECONDARY}`,
  },
];
