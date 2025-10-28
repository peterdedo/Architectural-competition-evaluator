export const indicators = [
  // 1. VYUŽITÍ ÚZEMÍ
  { id: 'U01', nazev: 'Celková plocha řešeného území', jednotka: 'm²', kategorie: 'Využití území', description: 'Rozloha území, které je předmětem návrhu – základní měřítko pro všechny odvozené ukazatele.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'neutral', vaha: 1 },
  { id: 'U02', nazev: 'Zastavěná plocha objektů', jednotka: 'm²', kategorie: 'Využití území', description: 'Součet půdorysně zastavěných ploch všech budov v návrhu. Určuje intenzitu využití.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'down', vaha: 4 },
  { id: 'U03', nazev: 'Plochy zeleně (modrozelená infrastruktura)', jednotka: 'm²', kategorie: 'Využití území', description: 'Celková výměra všech vegetačních a vodních ploch – včetně zelených střech, parků a retenčních prvků.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'up', vaha: 5 },
  { id: 'U04', nazev: 'Plochy zpevněné (dopravní a pěší)', jednotka: 'm²', kategorie: 'Využití území', description: 'Plochy komunikací, chodníků, ploch pro shromažďování, které nejsou vegetační.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'down', vaha: 3 },
  { id: 'U05', nazev: 'Vodní prvky a retenční plochy', jednotka: 'm²', kategorie: 'Využití území', description: 'Vodní toky, nádrže, retenční systémy a povrchové hospodaření s vodou.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'up', vaha: 3 },
  { id: 'U06', nazev: 'Veřejný prostor a jeho kvalita', jednotka: '%', kategorie: 'Využití území', description: 'Podíl veřejně přístupných ploch v návrhu a jejich prostorová kvalita (dle AI analýzy nebo hodnotitele).', typ: 'kvalitativní', zdroj: 'AI analýza', trend: 'up', vaha: 5 },

  // 2. INTENZITA VYUŽITÍ
  { id: 'I01', nazev: 'Hrubá podlažní plocha (HPP)', jednotka: 'm²', kategorie: 'Intenzita využití', description: 'Součet všech podlažních ploch nadzemních objektů v území.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'neutral', vaha: 2 },
  { id: 'I02', nazev: 'Koeficient intenzity využití území', jednotka: 'index', kategorie: 'Intenzita využití', description: 'Poměr HPP ku celkové ploše území. Vyjadřuje hustotu zástavby.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 3 },
  { id: 'I03', nazev: 'Koeficient zastavění', jednotka: '%', kategorie: 'Intenzita využití', description: 'Poměr zastavěné plochy k ploše území. Důležitý pro míru nepropustnosti.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'down', vaha: 4 },

  // 3. FUNKČNÍ ROZVRŽENÍ
  { id: 'F01', nazev: 'Podíl ploch pro bydlení', jednotka: '%', kategorie: 'Funkční rozvržení', description: 'Podíl obytných funkcí v rámci celkové HPP návrhu.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 3 },
  { id: 'F02', nazev: 'Podíl ploch pro práci (kanceláře a služby)', jednotka: '%', kategorie: 'Funkční rozvržení', description: 'Podíl ploch určených pro zaměstnanost a služby.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 3 },
  { id: 'F03', nazev: 'Podíl komerčních ploch (obchod)', jednotka: '%', kategorie: 'Funkční rozvržení', description: 'Podíl obchodních a komerčních funkcí v návrhu.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 2 },
  { id: 'F04', nazev: 'Podíl veřejné vybavenosti', jednotka: '%', kategorie: 'Funkční rozvržení', description: 'Zastoupení ploch pro školy, zdraví, kulturu, sport a komunitní funkce.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'up', vaha: 5 },
  { id: 'F05', nazev: 'Podíl ploch pro rekreaci a volný čas', jednotka: '%', kategorie: 'Funkční rozvržení', description: 'Podíl ploch vyčleněných pro rekreační a sportovní využití.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'up', vaha: 3 },
  { id: 'F06', nazev: 'Podíl technických a obslužných ploch', jednotka: '%', kategorie: 'Funkční rozvržení', description: 'Technické prostory a zázemí — komunikace, chodby, zázemí budov.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 1 },

  // 4. DOPRAVA A PARKOVÁNÍ
  { id: 'D01', nazev: 'Počet krytých parkovacích stání', jednotka: 'ks', kategorie: 'Doprava a parkování', description: 'Celkový počet parkovacích stání v garážích nebo v budovách.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'down', vaha: 3 },
  { id: 'D02', nazev: 'Počet venkovních parkovacích stání', jednotka: 'ks', kategorie: 'Doprava a parkování', description: 'Parkovací stání umístěná na povrchu – přímý dopad na zpevněné plochy a mikroklima.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'down', vaha: 4 },
  { id: 'D03', nazev: 'Počet podzemních parkovacích stání', jednotka: 'ks', kategorie: 'Doprava a parkování', description: 'Podzemní parkování snižuje zábory ploch a zvyšuje kvalitu veřejného prostoru.', typ: 'kvantitativní', zdroj: 'OCR', trend: 'up', vaha: 3 },
  { id: 'D04', nazev: 'Poměr parkovacích míst k HPP', jednotka: 'ks/1000m²', kategorie: 'Doprava a parkování', description: 'Počet parkovacích míst vztažený k velikosti podlažních ploch. Vyjadřuje dopravní náročnost.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'down', vaha: 4 },

  // 5. HUSTOTA OSÍDLENÍ A ZAMĚSTNANOSTI
  { id: 'H01', nazev: 'Odhadovaný počet obyvatel', jednotka: 'os', kategorie: 'Hustota osídlení a zaměstnanosti', description: 'Počet obyvatel podle plochy bydlení a průměrné velikosti bytu.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 2 },
  { id: 'H02', nazev: 'Odhadovaný počet pracovních míst', jednotka: 'os', kategorie: 'Hustota osídlení a zaměstnanosti', description: 'Počet zaměstnanců podle HPP kanceláří a komerčních ploch.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 2 },
  { id: 'H03', nazev: 'Hustota obyvatel', jednotka: 'os/ha', kategorie: 'Hustota osídlení a zaměstnanosti', description: 'Počet obyvatel na hektar území – měřítko obytné hustoty.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 3 },
  { id: 'H04', nazev: 'Hustota pracovních míst', jednotka: 'místa/ha', kategorie: 'Hustota osídlení a zaměstnanosti', description: 'Počet pracovních míst na hektar – ukazatel ekonomické intenzity území.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'neutral', vaha: 3 },

  // 6. NÁKLADOVÁ EFEKTIVITA
  { id: 'N01', nazev: 'Celkové investiční náklady', jednotka: 'Kč', kategorie: 'Nákladová efektivita', description: 'Souhrnný odhad investičních nákladů v návrhu.', typ: 'kvantitativní', zdroj: 'odhad', trend: 'down', vaha: 4 },
  { id: 'N02', nazev: 'Investiční náklad na jednotku plochy', jednotka: 'Kč/m²', kategorie: 'Nákladová efektivita', description: 'Poměr nákladů k HPP. Vyjadřuje efektivitu návrhu z hlediska nákladů.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'down', vaha: 4 },
  { id: 'N03', nazev: 'Odhadovaná hodnota území po realizaci', jednotka: 'Kč', kategorie: 'Nákladová efektivita', description: 'Tržní hodnota po dokončení – syntéza ekonomické a urbanistické kvality.', typ: 'kvantitativní', zdroj: 'AI analýza', trend: 'up', vaha: 5 },

  // 7. KVALITA VEŘEJNÉHO PROSTORU A KRAJINY
  { id: 'K01', nazev: 'Podíl zeleně v území', jednotka: '%', kategorie: 'Kvalita veřejného prostoru a krajiny', description: 'Podíl vegetačních ploch na celkové rozloze území.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'up', vaha: 4 },
  { id: 'K02', nazev: 'Podíl modré infrastruktury', jednotka: '%', kategorie: 'Kvalita veřejného prostoru a krajiny', description: 'Podíl vodních a retenčních ploch na území.', typ: 'kvantitativní', zdroj: 'výpočet', trend: 'up', vaha: 3 },
  { id: 'K03', nazev: 'Míra permeability a prostupnosti', jednotka: '%', kategorie: 'Kvalita veřejného prostoru a krajiny', description: 'Procento průchodných a přístupných ploch pro veřejnost.', typ: 'kvalitativní', zdroj: 'AI analýza', trend: 'up', vaha: 4 },

  // 8. URBANISTICKÁ KVALITA
  { id: 'Q01', nazev: 'Urbanistická čitelnost a orientace', jednotka: '%', kategorie: 'Urbanistická kvalita', description: 'Míra přehlednosti struktury návrhu – logika uliční sítě, čitelnost prostorů.', typ: 'kvalitativní', zdroj: 'AI analýza', trend: 'up', vaha: 4 },
  { id: 'Q02', nazev: 'Funkční a sociální diverzita', jednotka: '%', kategorie: 'Urbanistická kvalita', description: 'Vyváženost a rozmanitost funkcí, věkových skupin a využití prostoru.', typ: 'kvalitativní', zdroj: 'AI analýza', trend: 'up', vaha: 5 },
  { id: 'Q03', nazev: 'Propojení na okolí a dopravní návaznost', jednotka: '%', kategorie: 'Urbanistická kvalita', description: 'Míra integrace návrhu s okolní zástavbou a dostupností MHD.', typ: 'kvalitativní', zdroj: 'AI analýza', trend: 'up', vaha: 4 },
  { id: 'Q04', nazev: 'Kvalita architektonického a prostorového řešení', jednotka: '%', kategorie: 'Urbanistická kvalita', description: 'Estetická a kompoziční úroveň návrhu, harmonie objemů, materiálů a měřítka.', typ: 'kvalitativní', zdroj: 'hodnocení', trend: 'up', vaha: 5 },
  { id: 'Q05', nazev: 'Udržitelnost návrhu a environmentální integrace', jednotka: '%', kategorie: 'Urbanistická kvalita', description: 'Zohlednění principů udržitelnosti – zelené střechy, fotovoltaika, hospodaření s vodou.', typ: 'kvalitativní', zdroj: 'AI analýza', trend: 'up', vaha: 5 },
];

