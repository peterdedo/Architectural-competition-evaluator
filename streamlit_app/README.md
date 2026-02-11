# Urbanistická analýza – Streamlit (plná aplikácia)

Plná verzia urbanistickej analýzy pre **Streamlit Cloud**: nahratie dát, váhy, výpočet skóre, porovnanie projektov, heatmapa, export.

## Lokálne spustenie

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

Otvorí sa `http://localhost:8501`.

## Publikovanie na Streamlit Cloud

- **Main file path:** `streamlit_app/app.py`
- **Working directory:** `streamlit_app`
- Viac v `STREAMLIT_DEPLOY.md`.

## Funkcie

- **Nahratie dát** – CSV alebo JSON (viac projektov); prvý stĺpec CSV = názov projektu, ostatné = id indikátorov (U01, F01, …).
- **Demo dáta** – tlačidlo načíta 3 vzorové projekty.
- **Váhy kategórií** – sidebar s posuvníkmi (súčet sa normalizuje).
- **Výpočet skóre** – min-max normalizácia cez projekty, vážený súčet (kompatibilné s React EvaluationEngine).
- **Výsledky** – tabuľka (Projekt, Skóre, Skóre %, Plnosť dát), stĺpcový graf, heatmapa indikátorov.
- **Export** – stiahnutie výsledkov ako CSV.
- **Detail** – rozbaliteľný detail indikátorov pre víťazný projekt.
