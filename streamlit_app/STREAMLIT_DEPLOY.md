# Nasadenie na Streamlit Community Cloud

## Predpoklad

- Aplikácia `streamlit_app` je pushnutá na GitHub v repozitári  
  **https://github.com/peterdedo/Architectural-competition-evaluator**

---

## Kroky na share.streamlit.io

### 1. Otvor Streamlit Cloud

Choď na: **https://share.streamlit.io**  
(alebo **https://streamlit.io/cloud** a „Community Cloud“)

### 2. Prihlásenie

- Klikni na **„Sign up“** alebo **„Log in“**
- Prihlás sa cez **GitHub** (tvoj účet, pod ktorým je repozitár `peterdedo/Architectural-competition-evaluator`)

### 3. Nová aplikácia

- Klikni **„New app“**
- Vyplň:
  - **Repository:** `peterdedo/Architectural-competition-evaluator`
  - **Branch:** `main`
  - **Main file path:** `streamlit_app/app.py`
- Klikni **„Advanced settings“** a nastav:
  - **Working directory:** `streamlit_app`  
    (nechaj prázdne len ak by to bez toho fungovalo)
- Klikni **„Deploy!“**

### 4. Po nasadení

- Streamlit zostaví obraz a spustí app (môže to trvať 1–2 minúty).
- Dostaneš odkaz typu:  
  `https://peterdedo-architectural-competition-evaluator-streamlit-app-xxxxx.streamlit.app`
- Tento odkaz môžeš zdieľať alebo vložiť do README na GitHube.

---

## Ak niečo zlyhá

- **App sa nenačíta / ModuleNotFoundError**  
  Skontroluj, že **Main file path** je presne `streamlit_app/app.py` a **Working directory** je `streamlit_app`.

- **Build zlyhá**  
  V deploy logu na share.streamlit.io zisti, či sa nainštaloval `requirements.txt` z priečinka `streamlit_app`. Mal by byť použitý automaticky.

- **Zmeny v kóde**  
  Po ďalšom pushi na `main` sa app na Streamlit Cloud zvyčajne reštartuje a načíta novú verziu (môže byť potrebný manuálny „Reboot“ v dashboarde).

---

## Súhrn nastavení

| Pole                | Hodnota                                  |
|---------------------|------------------------------------------|
| Repository          | `peterdedo/Architectural-competition-evaluator` |
| Branch              | `main`                                  |
| Main file path      | `streamlit_app/app.py`                   |
| Working directory   | `streamlit_app`                          |
