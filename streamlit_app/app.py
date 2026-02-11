"""
Urbanistická analýza – rovnaký beh ako pôvodná aplikácia na localhoste
Kroky: Konfigurácia → Kritériá → Nahratie → Výsledky → Porovnanie
"""
import io
import streamlit as st
import pandas as pd
from data import KATEGORIE, INDIKATORY, get_indikatory_by_kategorie
from engine import compute_scores_like_react, get_normalized_values_for_heatmap, get_best_value, _extract_value
from parser import parse_csv, parse_json
from demo_data import DEMO_PROJECTS

st.set_page_config(page_title="Urbanistická analýza", page_icon="🏗️", layout="wide", initial_sidebar_state="expanded")

# Konštanty krokov (ako v App.jsx)
KROKY = ["konfigurace", "kriteria", "nahrani", "vysledky", "porovnani"]
KROK_LABELS = {
    "konfigurace": "Konfigurácia",
    "kriteria": "Výber kritérií",
    "nahrani": "Nahranie návrhov",
    "vysledky": "Výsledky analýzy",
    "porovnani": "Porovnanie návrhov",
}

# Session state
def _init():
    if "krok" not in st.session_state:
        st.session_state["krok"] = "konfigurace"
    if "projects" not in st.session_state:
        st.session_state["projects"] = []
    if "vybrane_indikatory" not in st.session_state:
        st.session_state["vybrane_indikatory"] = set(i["id"] for i in INDIKATORY)
    if "vahy" not in st.session_state:
        st.session_state["vahy"] = {i["id"]: i.get("vaha", 10) for i in INDIKATORY}
    if "category_weights" not in st.session_state:
        total = sum(c.get("vaha", 1) for c in KATEGORIE for c in [c] if False) or len(KATEGORIE)
        st.session_state["category_weights"] = {c["id"]: round(100 / len(KATEGORIE), 1) for c in KATEGORIE}
    if "vybrane_projekty" not in st.session_state:
        st.session_state["vybrane_projekty"] = set()
_init()

ind_by_cat = get_indikatory_by_kategorie()

# ----- Sidebar: navigácia -----
st.sidebar.title("🏗️ Urbanistická analýza")
st.sidebar.caption("Rovnaký beh ako pôvodná aplikácia")
aktuálny_idx = KROKY.index(st.session_state["krok"])
vybraný_krok = st.sidebar.radio(
    "Krok",
    range(len(KROKY)),
    format_func=lambda i: KROK_LABELS[KROKY[i]],
    index=aktuálny_idx,
    key="nav_krok",
)
st.session_state["krok"] = KROKY[vybraný_krok]

# ----- Hlavný obsah podľa kroku -----

if st.session_state["krok"] == "konfigurace":
    st.header("Konfigurácia")
    st.info("Voliteľne môžete v budúcnosti zadať API kľúč pre AI funkcie. Pre porovnanie návrhov z CSV/JSON nie je potrebný.")
    if st.button("Pokračovať na Výber kritérií →"):
        st.session_state["krok"] = "kriteria"
        st.rerun()

elif st.session_state["krok"] == "kriteria":
    st.header("Výber kritérií a váhy")
    st.caption("Vyberte indikátory a nastavte ich váhy (default 10). Súčet váh kategórií môže byť 100 %.")

    # Váhy kategórií
    with st.expander("Váhy kategórií", expanded=True):
        for cat in KATEGORIE:
            cid = cat["id"]
            st.session_state["category_weights"][cid] = st.slider(
                f"{cat['ikona']} {cat['nazev']}",
                0, 100, int(st.session_state["category_weights"].get(cid, 100 // len(KATEGORIE))),
                1, key=f"cw_{cid}"
            )
        st.caption(f"Súčet: {sum(st.session_state['category_weights'].values()):.0f} %")

    # Výber indikátorov a váhy
    vybrane = set(st.session_state.get("vybrane_indikatory", set()))
    vahy = dict(st.session_state.get("vahy", {}))
    for cat in KATEGORIE:
        inds = ind_by_cat.get(cat["id"], [])
        if not inds:
            continue
        with st.expander(f"{cat['ikona']} {cat['nazev']} ({len(inds)} indikátorov)"):
            for ind in inds:
                col1, col2 = st.columns([3, 1])
                with col1:
                    checked = st.checkbox(
                        f"{ind.get('ikona','')} {ind['nazev']}",
                        value=ind["id"] in vybrane,
                        key=f"ch_{ind['id']}"
                    )
                with col2:
                    w = st.number_input("Váha", 0, 100, int(vahy.get(ind["id"], 10)), 1, key=f"w_{ind['id']}")
                if checked:
                    vybrane.add(ind["id"])
                else:
                    vybrane.discard(ind["id"])
                vahy[ind["id"]] = w
    st.session_state["vybrane_indikatory"] = vybrane
    st.session_state["vahy"] = vahy

    st.markdown("---")
    if st.button("Pokračovať na Nahranie návrhov →"):
        st.session_state["krok"] = "nahrani"
        st.rerun()

elif st.session_state["krok"] == "nahrani":
    st.header("Nahranie návrhov")
    st.caption("Nahrajte CSV alebo JSON so zoznamom projektov (prvý stĺpec = názov, ostatné = id indikátorov).")

    uploaded = st.file_uploader("CSV alebo JSON", type=["csv", "json"], accept_multiple_files=True)
    if uploaded:
        new_projects = []
        for f in uploaded:
            content = f.read().decode("utf-8", errors="replace")
            try:
                if (f.name or "").lower().endswith(".csv"):
                    new_projects.extend(parse_csv(content, f.name or "upload"))
                else:
                    new_projects.extend(parse_json(content, f.name or "upload"))
            except Exception as e:
                st.error(f"Chyba {f.name}: {e}")
        if new_projects:
            st.session_state["projects"] = new_projects
            st.session_state["vybrane_projekty"] = {p["id"] for p in new_projects}
            st.success(f"Načítaných {len(new_projects)} projektov.")
            st.rerun()

    if st.button("📋 Použiť demo dáta (3 projekty)"):
        st.session_state["projects"] = [p.copy() for p in DEMO_PROJECTS]
        st.session_state["vybrane_projekty"] = {p["id"] for p in DEMO_PROJECTS}
        st.rerun()

    if st.session_state["projects"]:
        st.subheader("Načítané projekty")
        for p in st.session_state["projects"]:
            st.write(f"- **{p.get('nazev', p.get('id'))}**")
        st.markdown("---")
        if st.button("Pokračovať na Výsledky analýzy →"):
            st.session_state["krok"] = "vysledky"
            st.rerun()

elif st.session_state["krok"] == "vysledky":
    st.header("Výsledky analýzy")
    projects = st.session_state["projects"]
    vybrane = st.session_state["vybrane_indikatory"]
    vahy = st.session_state["vahy"]

    if not vybrane:
        st.warning("Vyberte aspoň jeden indikátor v kroku Kritériá.")
        if st.button("← Späť na Výber kritérií"):
            st.session_state["krok"] = "kriteria"
            st.rerun()
        st.stop()

    indicators = [i for i in INDIKATORY if i["id"] in vybrane]
    zpracovane = [p for p in projects if p.get("data") and len(p.get("data") or {}) > 0]
    if not zpracovane:
        st.warning("Žiadne projekty s dátami. Nahrajte súbory v kroku Nahranie.")
        if st.button("← Späť na Nahranie"):
            st.session_state["krok"] = "nahrani"
            st.rerun()
        st.stop()

    scored = compute_scores_like_react(zpracovane, indicators, vahy)
    st.session_state["vybrane_projekty"] = {p["id"] for p in scored}

    df = pd.DataFrame([
        {"Projekt": p["nazev"], "Skóre %": p["weightedScore"], "Plnosť dát %": p["completionRate"]}
        for p in scored
    ])
    st.dataframe(df, use_container_width=True, hide_index=True)
    st.bar_chart(df.set_index("Projekt")["Skóre %"])
    if st.button("Pokračovať na Porovnanie návrhov →"):
        st.session_state["krok"] = "porovnani"
        st.rerun()

elif st.session_state["krok"] == "porovnani":
    st.header("Porovnanie návrhov")
    projects = st.session_state["projects"]
    vybrane = st.session_state["vybrane_indikatory"]
    vahy = st.session_state["vahy"]
    vybrane_proj = st.session_state["vybrane_projekty"]

    if not vybrane:
        st.warning("Vyberte indikátory v kroku Kritériá.")
        st.stop()
    indicators = [i for i in INDIKATORY if i["id"] in vybrane]
    zpracovane = [p for p in projects if p.get("data") and len(p.get("data") or {}) > 0]
    if not zpracovane:
        st.warning("Žiadne projekty s dátami.")
        st.stop()

    # Výber projektov k porovnaniu
    st.subheader("Výber návrhov k porovnaniu")
    for p in zpracovane:
        checked = st.checkbox(p["nazev"], value=p["id"] in vybrane_proj, key=f"vp_{p['id']}")
        if checked:
            vybrane_proj.add(p["id"])
        else:
            vybrane_proj.discard(p["id"])
    st.session_state["vybrane_projekty"] = vybrane_proj
    compare_list = [p for p in zpracovane if p["id"] in vybrane_proj]
    if not compare_list:
        st.info("Vyberte aspoň jeden návrh.")
        st.stop()

    scored = compute_scores_like_react(compare_list, indicators, vahy)

    # Tabuľka výsledkov
    st.subheader("Výsledky")
    st.dataframe(pd.DataFrame([
        {"Projekt": p["nazev"], "Skóre %": p["weightedScore"], "Plnosť %": p["completionRate"]}
        for p in scored
    ]), use_container_width=True, hide_index=True)
    st.bar_chart(pd.DataFrame([{"Projekt": p["nazev"], "Skóre %": p["weightedScore"]} for p in scored]).set_index("Projekt"))

    # Tabuľka: projekty × indikátory (hodnoty, zvýraznenie najlepších)
    st.subheader("Tabuľka hodnôt")
    def format_val(val, jednotka):
        v = _extract_value(val)
        if v is None:
            return "—"
        return f"{v:,.0f}".replace(",", " ") + f" {jednotka}".strip()

    rows = []
    for p in scored:
        row = {"Projekt": p["nazev"]}
        for ind in indicators:
            val = (p.get("data") or {}).get(ind["id"])
            best = get_best_value(ind["id"], compare_list, ind.get("lower_better", False))
            actual = _extract_value(val)
            is_best = best is not None and actual is not None and abs(actual - best) < 1e-6
            row[ind["id"]] = format_val(val, ind.get("jednotka", "")) + (" ✓" if is_best else "")
        rows.append(row)
    st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

    # Heatmapa (normalizované hodnoty)
    st.subheader("Heatmapa (normalizované 0–100)")
    heat = get_normalized_values_for_heatmap(compare_list, indicators)
    cols_show = [i["id"] for i in indicators[:20]]
    heat_df = pd.DataFrame([{**{c: h.get(c) for c in cols_show}, "Projekt": h["nazev"]} for h in heat]).set_index("Projekt")
    st.dataframe(heat_df.style.background_gradient(cmap="RdYlGn", axis=None, vmin=0, vmax=100), use_container_width=True, height=min(400, 80 + len(compare_list) * 28))

    # Export
    buf = io.StringIO()
    pd.DataFrame([{"Projekt": p["nazev"], "Skóre %": p["weightedScore"], "Plnosť %": p["completionRate"]} for p in scored]).to_csv(buf, index=False)
    st.download_button("Stiahnuť výsledky (CSV)", buf.getvalue(), file_name="porovnanie_vysledky.csv", mime="text/csv")

    st.sidebar.divider()
    if st.sidebar.button("← Späť na Výsledky"):
        st.session_state["krok"] = "vysledky"
        st.rerun()
