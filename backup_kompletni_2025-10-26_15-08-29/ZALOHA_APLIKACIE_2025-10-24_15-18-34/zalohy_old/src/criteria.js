// Definice kritérií mimo komponentu pro správnou inicializaci
export const CRITERIA = {
  // Environmentální indikátory
  'gfa_living': { name: 'GFA living', unit: 'm²', category: 'Environmentální', description: 'Gross Floor Area - obytná plocha' },
  'green_areas': { name: 'Green areas', unit: 'm²', category: 'Environmentální', description: 'Zelené plochy' },
  'blue_infrastructure': { name: 'Blue infrastructure', unit: 'm²', category: 'Environmentální', description: 'Modrá infrastruktura (vodní prvky)' },
  'biodiversity_index': { name: 'Biodiversity index', unit: 'index', category: 'Environmentální', description: 'Index biologické rozmanitosti' },
  'carbon_footprint': { name: 'Carbon footprint', unit: 't CO₂/rok', category: 'Environmentální', description: 'Uhlíková stopa' },
  'energy_efficiency': { name: 'Energy efficiency', unit: 'kWh/m²/rok', category: 'Environmentální', description: 'Energetická účinnost' },

  // Ekonomické indikátory
  'investment_cost': { name: 'Investment cost', unit: 'Kč', category: 'Ekonomické', description: 'Investiční náklady' },
  'investment_cost_per_m2_gfa': { name: 'Investment cost per m2 GFA', unit: 'Kč/m²', category: 'Ekonomické', description: 'Investiční náklady na m² GFA' },
  'operating_costs': { name: 'Operating costs', unit: 'Kč/rok', category: 'Ekonomické', description: 'Provozní náklady' },
  'rental_income': { name: 'Rental income', unit: 'Kč/rok', category: 'Ekonomické', description: 'Příjmy z pronájmu' },
  'roi': { name: 'ROI (Return on Investment)', unit: '%', category: 'Ekonomické', description: 'Návratnost investice' },
  'npv': { name: 'NPV (Net Present Value)', unit: 'Kč', category: 'Ekonomické', description: 'Čistá současná hodnota' },

  // Sociální indikátory
  'balance_of_population': { name: 'Balance of population', unit: 'index', category: 'Sociální', description: 'Vyváženost populace' },
  'accessibility_public_transport': { name: 'Accessibility public transport', unit: 'min', category: 'Sociální', description: 'Dostupnost veřejné dopravy' },
  'social_infrastructure': { name: 'Social infrastructure', unit: 'index', category: 'Sociální', description: 'Sociální infrastruktura' },
  'affordable_housing': { name: 'Affordable housing', unit: '%', category: 'Sociální', description: 'Dostupné bydlení' },
  'jobs_created': { name: 'Jobs created', unit: 'ks', category: 'Sociální', description: 'Vytvořená pracovní místa' },

  // Urbanistické indikátory
  'density': { name: 'Density', unit: 'obyv./ha', category: 'Urbanistické', description: 'Hustota zalidnění' },
  'walkability_score': { name: 'Walkability score', unit: 'index', category: 'Urbanistické', description: 'Index pěší dostupnosti' },
  'public_spaces_ratio': { name: 'Public spaces ratio', unit: '%', category: 'Urbanistické', description: 'Poměr veřejných prostor' },
  'mixed_use_index': { name: 'Mixed use index', unit: 'index', category: 'Urbanistické', description: 'Index smíšeného využití' },
  'connectivity': { name: 'Connectivity', unit: 'index', category: 'Urbanistické', description: 'Propojenost' },

  // Technické indikátory
  'building_height': { name: 'Building height', unit: 'm', category: 'Technické', description: 'Výška budov' },
  'parking_spaces': { name: 'Parking spaces', unit: 'ks', category: 'Technické', description: 'Parkovací místa' },
  'building_materials': { name: 'Building materials', unit: 'index', category: 'Technické', description: 'Stavební materiály' },
  'technical_infrastructure': { name: 'Technical infrastructure', unit: 'index', category: 'Technické', description: 'Technická infrastruktura' },

  // Celková plocha (původní)
  'total_area': { name: 'Total area', unit: 'm²', category: 'Plochy', description: 'Celková plocha' },
  'built_up_area': { name: 'Built-up area', unit: 'm²', category: 'Plochy', description: 'Zastavěná plocha' },
  'green_area': { name: 'Green area', unit: 'm²', category: 'Plochy', description: 'Zelená plocha' }
};




