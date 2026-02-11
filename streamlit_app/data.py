# Urbanistické indikátory a kategórie (pre Streamlit)

KATEGORIE = [
    {"id": "vyuziti-uzemi", "nazev": "Využití území", "barva": "#3B82F6", "ikona": "🏗️"},
    {"id": "intenzita-vyuziti", "nazev": "Intenzita využití", "barva": "#10B981", "ikona": "📊"},
    {"id": "funkcni-rozvrzeni", "nazev": "Funkční rozvržení", "barva": "#F59E0B", "ikona": "🏢"},
    {"id": "doprava-parkovani", "nazev": "Doprava a parkování", "barva": "#EF4444", "ikona": "🚗"},
    {"id": "hustota-osidleni", "nazev": "Hustota osídlení", "barva": "#8B5CF6", "ikona": "👥"},
    {"id": "nakladova-efektivita", "nazev": "Nákladová efektivita", "barva": "#06B6D4", "ikona": "💰"},
    {"id": "kvalita-verejneho-prostoru", "nazev": "Kvalita veřejného prostoru", "barva": "#84CC16", "ikona": "🌳"},
    {"id": "urbanisticka-kvalita", "nazev": "Urbanistická kvalita", "barva": "#F97316", "ikona": "🏛️"},
]

INDIKATORY = [
    {"id": "U01", "nazev": "Celková plocha řešeného území", "jednotka": "m²", "kategorie": "vyuziti-uzemi", "vaha": 1, "ikona": "📐", "lower_better": False},
    {"id": "U02", "nazev": "Zastavěná plocha objektů", "jednotka": "m²", "kategorie": "vyuziti-uzemi", "vaha": 4, "ikona": "🏢", "lower_better": False},
    {"id": "U03", "nazev": "Plochy zeleně", "jednotka": "m²", "kategorie": "vyuziti-uzemi", "vaha": 5, "ikona": "🌿", "lower_better": False},
    {"id": "U04", "nazev": "Plochy zpevněné", "jednotka": "m²", "kategorie": "vyuziti-uzemi", "vaha": 3, "ikona": "🛣️", "lower_better": False},
    {"id": "U05", "nazev": "Vodní prvky a retenční plochy", "jednotka": "m²", "kategorie": "vyuziti-uzemi", "vaha": 3, "ikona": "💧", "lower_better": False},
    {"id": "U06", "nazev": "Veřejný prostor a jeho kvalita", "jednotka": "%", "kategorie": "vyuziti-uzemi", "vaha": 5, "ikona": "🏛️", "lower_better": False},
    {"id": "I01", "nazev": "Hrubá podlažní plocha (HPP)", "jednotka": "m²", "kategorie": "intenzita-vyuziti", "vaha": 2, "ikona": "📊", "lower_better": False},
    {"id": "I02", "nazev": "Koeficient intenzity využití", "jednotka": "index", "kategorie": "intenzita-vyuziti", "vaha": 3, "ikona": "📈", "lower_better": False},
    {"id": "I03", "nazev": "Koeficient zastavění", "jednotka": "%", "kategorie": "intenzita-vyuziti", "vaha": 4, "ikona": "🏗️", "lower_better": False},
    {"id": "F01", "nazev": "Podlažní plocha bydlení", "jednotka": "m²", "kategorie": "funkcni-rozvrzeni", "vaha": 3, "ikona": "🏠", "lower_better": False},
    {"id": "F02", "nazev": "Podlažní plocha kanceláře a služby", "jednotka": "m²", "kategorie": "funkcni-rozvrzeni", "vaha": 3, "ikona": "🏢", "lower_better": False},
    {"id": "F03", "nazev": "Podlažní plocha komerce", "jednotka": "m²", "kategorie": "funkcni-rozvrzeni", "vaha": 2, "ikona": "🛍️", "lower_better": False},
    {"id": "F04", "nazev": "Podlažní plocha veřejná vybavenost", "jednotka": "m²", "kategorie": "funkcni-rozvrzeni", "vaha": 5, "ikona": "🏛️", "lower_better": False},
    {"id": "F05", "nazev": "Plocha pro sport a rekreaci", "jednotka": "m²", "kategorie": "funkcni-rozvrzeni", "vaha": 3, "ikona": "⚽", "lower_better": False},
    {"id": "F06", "nazev": "Podlažní plocha technické zázemí", "jednotka": "m²", "kategorie": "funkcni-rozvrzeni", "vaha": 1, "ikona": "⚙️", "lower_better": False},
    {"id": "D01", "nazev": "Počet krytých parkovacích stání", "jednotka": "ks", "kategorie": "doprava-parkovani", "vaha": 3, "ikona": "🚗", "lower_better": False},
    {"id": "D02", "nazev": "Počet venkovních parkovacích stání", "jednotka": "ks", "kategorie": "doprava-parkovani", "vaha": 4, "ikona": "🅿️", "lower_better": False},
    {"id": "D03", "nazev": "Počet podzemních parkovacích stání", "jednotka": "ks", "kategorie": "doprava-parkovani", "vaha": 3, "ikona": "🚇", "lower_better": False},
    {"id": "D04", "nazev": "Poměr parkovacích míst k HPP", "jednotka": "ks/1000m²", "kategorie": "doprava-parkovani", "vaha": 4, "ikona": "📊", "lower_better": False},
    {"id": "H01", "nazev": "Odhadovaný počet obyvatel", "jednotka": "os", "kategorie": "hustota-osidleni", "vaha": 2, "ikona": "👥", "lower_better": False},
    {"id": "H02", "nazev": "Odhadovaný počet pracovních míst", "jednotka": "os", "kategorie": "hustota-osidleni", "vaha": 2, "ikona": "💼", "lower_better": False},
    {"id": "H03", "nazev": "Hustota obyvatel", "jednotka": "os/ha", "kategorie": "hustota-osidleni", "vaha": 3, "ikona": "📊", "lower_better": False},
    {"id": "H04", "nazev": "Hustota pracovních míst", "jednotka": "místa/ha", "kategorie": "hustota-osidleni", "vaha": 3, "ikona": "📈", "lower_better": False},
    {"id": "N01", "nazev": "Celkové investiční náklady", "jednotka": "Kč", "kategorie": "nakladova-efektivita", "vaha": 4, "ikona": "💰", "lower_better": True},
    {"id": "N02", "nazev": "Investiční náklad na jednotku plochy", "jednotka": "Kč/m²", "kategorie": "nakladova-efektivita", "vaha": 4, "ikona": "📊", "lower_better": True},
    {"id": "N03", "nazev": "Odhadovaná hodnota území po realizaci", "jednotka": "Kč", "kategorie": "nakladova-efektivita", "vaha": 5, "ikona": "💎", "lower_better": False},
    {"id": "K01", "nazev": "Podíl zeleně v území", "jednotka": "%", "kategorie": "kvalita-verejneho-prostoru", "vaha": 4, "ikona": "🌳", "lower_better": False},
    {"id": "K02", "nazev": "Podíl modré infrastruktury", "jednotka": "%", "kategorie": "kvalita-verejneho-prostoru", "vaha": 3, "ikona": "💧", "lower_better": False},
    {"id": "K03", "nazev": "Míra permeability", "jednotka": "%", "kategorie": "kvalita-verejneho-prostoru", "vaha": 4, "ikona": "🚶", "lower_better": False},
    {"id": "Q01", "nazev": "Urbanistická čitelnost", "jednotka": "%", "kategorie": "urbanisticka-kvalita", "vaha": 4, "ikona": "🗺️", "lower_better": False},
    {"id": "Q02", "nazev": "Funkční a sociální diverzita", "jednotka": "%", "kategorie": "urbanisticka-kvalita", "vaha": 5, "ikona": "🌈", "lower_better": False},
    {"id": "Q03", "nazev": "Propojení na okolí", "jednotka": "%", "kategorie": "urbanisticka-kvalita", "vaha": 4, "ikona": "🚌", "lower_better": False},
    {"id": "Q04", "nazev": "Kvalita architektonického řešení", "jednotka": "%", "kategorie": "urbanisticka-kvalita", "vaha": 5, "ikona": "🏛️", "lower_better": False},
    {"id": "Q05", "nazev": "Udržitelnost návrhu", "jednotka": "%", "kategorie": "urbanisticka-kvalita", "vaha": 5, "ikona": "🌱", "lower_better": False},
]

def get_indikatory_by_kategorie():
    out = {}
    for k in KATEGORIE:
        out[k["id"]] = [i for i in INDIKATORY if i["kategorie"] == k["id"]]
    return out

def get_kategorie_map():
    return {k["id"]: k for k in KATEGORIE}

def get_indikator_by_id(ind_id):
    for i in INDIKATORY:
        if i["id"] == ind_id:
            return i
    return None
