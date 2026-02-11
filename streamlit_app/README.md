# Urbanistická analýza – Streamlit

Jednoduchá verzia urbanistickej analýzy pre **Streamlit Cloud** (alebo lokálne spustenie).

## Lokálne spustenie

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run app.py
```

Otvorí sa `http://localhost:8501`.

## Publikovanie na Streamlit Cloud

1. Nahraj tento priečinok (`streamlit_app`) do **GitHub** repozitára (samostatný repozitár alebo podpriečinok).
2. Choď na [share.streamlit.io](https://share.streamlit.io).
3. Prihlás sa cez GitHub a vyber repozitár.
4. **Main file path:** zadaj `app.py` (alebo ak je app v podpriečinku: `streamlit_app/app.py`).
5. **Working directory:** ak je app v podpriečinku, nastav napr. `streamlit_app`.
6. Spusti deploy.

Ak je všetko v jednom repozitári a app je v podpriečinku `streamlit_app`, v Streamlit Cloud nastav:

- **Repository:** tvoj repozitár
- **Branch:** main (alebo master)
- **Main file path:** `streamlit_app/app.py`
- **Advanced settings** → Working directory: `streamlit_app` (voliteľné, môže byť prázdne ak cesty v kóde sú relatívne)

## Obsah aplikácie

- **Váhy kategórií** – sidebar, posuvníky
- **Celkové skóre** – vážený výsledok na demo dátach
- **Skóre podľa kategórií** – stĺpcový graf
- **Indikátory podľa kategórií** – tabuľka
- **Porovnanie kategórií** – váhy

Dáta sú zatiaľ demo (jeden projekt). Pre nahrávanie CSV a porovnanie viacerých projektov použite plnú React aplikáciu v koreni projektu.
