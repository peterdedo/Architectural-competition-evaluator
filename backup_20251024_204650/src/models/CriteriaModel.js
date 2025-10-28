export const CRITERIA = {
  // Plochy
  celkova_plocha: {
    name: "Celková plocha pozemku",
    unit: "m²",
    category: "Plochy",
    description: "Celková rozloha pozemku v m²",
    lower_better: false
  },
  zastavena_plocha: {
    name: "Zastavěná plocha",
    unit: "m²",
    category: "Plochy",
    description: "Plocha zastavěná budovami",
    lower_better: false
  },
  zelena_plocha: {
    name: "Zelená plocha",
    unit: "m²",
    category: "Plochy",
    description: "Plocha zeleně a parků",
    lower_better: false
  },
  parkovaci_plocha: {
    name: "Parkovací plocha",
    unit: "m²",
    category: "Plochy",
    description: "Plocha určená pro parkování",
    lower_better: false
  },
  
  // Ekonomické
  naklady: {
    name: "Celkové náklady",
    unit: "EUR",
    category: "Ekonomické",
    description: "Celkové investiční náklady projektu",
    lower_better: true
  },
  navratnost: {
    name: "Doba návratnosti",
    unit: "roky",
    category: "Ekonomické",
    description: "Očekávaná doba návratnosti investice",
    lower_better: true
  },
  cena_za_m2: {
    name: "Cena za m²",
    unit: "EUR/m²",
    category: "Ekonomické",
    description: "Průměrná cena za metr čtvereční",
    lower_better: true
  },
  
  // Udržitelnost
  energeticka_efektivnost: {
    name: "Energetická efektivnost",
    unit: "kWh/m²/rok",
    category: "Udržitelnost",
    description: "Spotřeba energie na m² za rok",
    lower_better: true
  },
  vodni_efektivnost: {
    name: "Vodní efektivnost",
    unit: "l/osoba/den",
    category: "Udržitelnost",
    description: "Spotřeba vody na osobu za den",
    lower_better: true
  },
  recyklace_odpadu: {
    name: "Recyklace odpadu",
    unit: "%",
    category: "Udržitelnost",
    description: "Procento recyklovaného odpadu",
    lower_better: false
  },
  zelena_energie: {
    name: "Podíl zelené energie",
    unit: "%",
    category: "Udržitelnost",
    description: "Procento energie z obnovitelných zdrojů",
    lower_better: false
  },
  
  // Sociální
  bytova_dostupnost: {
    name: "Bytová dostupnost",
    unit: "index",
    category: "Sociální",
    description: "Index dostupnosti bydlení pro různé příjmové skupiny",
    lower_better: false
  },
  socialni_infrastruktura: {
    name: "Sociální infrastruktura",
    unit: "počet",
    category: "Sociální",
    description: "Počet sociálních zařízení v okolí",
    lower_better: false
  },
  bezpecnost: {
    name: "Bezpečnost",
    unit: "index",
    category: "Sociální",
    description: "Index bezpečnosti v oblasti",
    lower_better: false
  },
  pristupnost: {
    name: "Přístupnost",
    unit: "index",
    category: "Sociální",
    description: "Index bezbariérové přístupnosti",
    lower_better: false
  },
  
  // Urbanistické
  hustota_zastavby: {
    name: "Hustota zastavby",
    unit: "%",
    category: "Urbanistické",
    description: "Procento zastavěné plochy z celkové plochy",
    lower_better: true
  },
  vyska_budov: {
    name: "Výška budov",
    unit: "m",
    category: "Urbanistické",
    description: "Průměrná výška budov",
    lower_better: true
  },
  vzdalenost_od_centra: {
    name: "Vzdálenost od centra",
    unit: "km",
    category: "Urbanistické",
    description: "Vzdálenost od centra města",
    lower_better: true
  },
  dopravni_dostupnost: {
    name: "Dopravní dostupnost",
    unit: "index",
    category: "Urbanistické",
    description: "Index kvality dopravního spojení",
    lower_better: false
  }
};

export const CATEGORIES = [
  { key: "Plochy", name: "Plochy", icon: "📐" },
  { key: "Ekonomické", name: "Ekonomické", icon: "💰" },
  { key: "Udržitelnost", name: "Udržitelnost", icon: "🌱" },
  { key: "Sociální", name: "Sociální", icon: "👥" },
  { key: "Urbanistické", name: "Urbanistické", icon: "🏗️" }
];

export const getCriteriaByCategory = (category) => {
  return Object.entries(CRITERIA)
    .filter(([key, criterion]) => criterion.category === category)
    .reduce((acc, [key, criterion]) => {
      acc[key] = criterion;
      return acc;
    }, {});
};

export const getAllCriteriaKeys = () => Object.keys(CRITERIA);

export const getCriteriaCount = () => Object.keys(CRITERIA).length;