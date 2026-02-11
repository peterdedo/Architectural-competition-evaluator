"""
Urbanistická analýza – Streamlit verzia
Pripravené na publikovanie na share.streamlit.io (Streamlit Cloud)
"""
import streamlit as st
import pandas as pd
from data import KATEGORIE, INDIKATORY, get_indikatory_by_kategorie, get_kategorie_map
from engine import calculate_project_score, normalize_value

st.set_page_config(
    page_title="Urbanistická analýza",
    page_icon="🏗️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Lokalizácia
st.markdown("""
<style>
    .stMetric { background: #f0f2f6; padding: 0.5rem 1rem; border-radius: 8px; }
    h1 { color: #1f77b4; }
</style>
""", unsafe_allow_html=True)

st.title("🏗️ Urbanistická analýza")
st.caption("Vyhodnotenie urbanistického návrhu podľa vážených indikátorov. Verzia pre Streamlit Cloud.")

# Sidebar – váhy kategórií
st.sidebar.header("⚖️ Váhy kategórií")
ind_by_cat = get_indikatory_by_kategorie()
cat_map = get_kategorie_map()

# Inicializácia session state pre váhy
if "category_weights" not in st.session_state:
    # Rovnomerne rozložené
    n_cat = len(KATEGORIE)
    st.session_state["category_weights"] = {c["id"]: round(100 / n_cat, 1) for c in KATEGORIE}
if "indicator_weights" not in st.session_state:
    st.session_state["indicator_weights"] = {}

for cat in KATEGORIE:
    cid = cat["id"]
    default = st.session_state["category_weights"].get(cid, 100 / len(KATEGORIE))
    w = st.sidebar.slider(
        f"{cat['ikona']} {cat['nazev']}",
        0.0, 50.0, float(default), 0.5,
        key=f"cat_{cid}",
    )
    st.session_state["category_weights"][cid] = w

total_cat = sum(st.session_state["category_weights"].values())
st.sidebar.metric("Súčet váh kategórií", f"{total_cat:.1f} %" if total_cat else "0 %")

# Demo hodnoty projektu (príklad)
DEMO_VALUES = {
    "U01": 15000, "U02": 4200, "U03": 3500, "U04": 2800, "U05": 400, "U06": 75,
    "I01": 25000, "I02": 1.65, "I03": 28, "F01": 12000, "F02": 5000, "F03": 2000,
    "F04": 3500, "F05": 1500, "F06": 1000, "D01": 120, "D02": 30, "D03": 90, "D04": 9.6,
    "H01": 240, "H02": 180, "H03": 160, "H04": 120, "N01": 180000000, "N02": 7200,
    "N03": 220000000, "K01": 23, "K02": 2.5, "K03": 65,
    "Q01": 78, "Q02": 72, "Q03": 85, "Q04": 80, "Q05": 70,
}

tab1, tab2, tab3 = st.tabs(["📊 Skóre a prehľad", "📋 Indikátory podľa kategórií", "📈 Porovnanie kategórií"])

# Indikátorové váhy: v rámci kategórie používame pôvodné vahy z dát (relatívne)
indicator_weights = {}
for cid, inds in ind_by_cat.items():
    indicator_weights[cid] = {i["id"]: i["vaha"] for i in inds}

with tab1:
    score = calculate_project_score(
        DEMO_VALUES,
        st.session_state["category_weights"],
        indicator_weights,
    )
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Celkové skóre projektu", f"{score:.1f} %", help="Vážený priemer všetkých indikátorov")
    with col2:
        st.metric("Počet kategórií", len(KATEGORIE), help="Aktívne kategórie")
    with col3:
        st.metric("Počet indikátorov", len(INDIKATORY), help="Všetky indikátory v modeli")

    # Skóre po kategóriách (zjednodušene)
    st.subheader("Skóre podľa kategórií")
    cat_scores = []
    for cat in KATEGORIE:
        cid = cat["id"]
        inds = ind_by_cat.get(cid, [])
        vals = [normalize_value(DEMO_VALUES.get(i["id"]), i) for i in inds]
        weights = [indicator_weights.get(cid, {}).get(i["id"], i["vaha"]) for i in inds]
        if sum(weights) > 0:
            cat_score = sum(v * w for v, w in zip(vals, weights)) / sum(weights)
        else:
            cat_score = 0
        cat_scores.append({"Kategória": f"{cat['ikona']} {cat['nazev']}", "Skóre %": round(cat_score, 1)})
    df_cat = pd.DataFrame(cat_scores)
    st.bar_chart(df_cat.set_index("Kategória"))

with tab2:
    for cat in KATEGORIE:
        with st.expander(f"{cat['ikona']} {cat['nazev']}"):
            inds = ind_by_cat.get(cat["id"], [])
            rows = []
            for i in inds:
                val = DEMO_VALUES.get(i["id"], "–")
                unit = i.get("jednotka", "")
                rows.append({
                    "Indikátor": f"{i.get('ikona','')} {i['nazev']}",
                    "Hodnota": f"{val} {unit}".strip() if val != "–" else "–",
                    "Váha": i.get("vaha", 0),
                })
            st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

with tab3:
    st.subheader("Váhy kategórií (aktuálne nastavenie)")
    w_df = pd.DataFrame([
        {"Kategória": f"{cat['ikona']} {cat['nazev']}", "Váha %": st.session_state["category_weights"].get(cat["id"], 0)}
        for cat in KATEGORIE
    ])
    st.bar_chart(w_df.set_index("Kategória"))

st.sidebar.divider()
st.sidebar.info(
    "Táto aplikácia používa demo dáta jedného projektu. "
    "V plnej verzii (React) môžete nahrávať CSV a porovnávať viacero variantov."
)
st.sidebar.link_button("Streamlit Cloud", "https://share.streamlit.io/", help="Tu môžete túto aplikáciu nasadiť")
