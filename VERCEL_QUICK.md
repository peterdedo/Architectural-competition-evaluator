# Vercel – rýchly deploy

## 1. Prihlásenie
- Choď na **https://vercel.com/login**
- Klikni **Continue with GitHub** (najjednoduchšie – prepojíš repozitár)

## 2. Projekt na GitHube
Ak ešte nemáš projekt na GitHube:
```bash
# V priečinku projektu (Vzkřísení)
git remote -v
# Ak nemáš origin, pridaj ho:
git remote add origin https://github.com/TVOJ_USER/NAZOV_REPO.git
git push -u origin main
```
(Názov repozitára môže byť napr. `urban-analytics` alebo `vzkriseni`.)

## 3. Nový projekt na Vercel
- Vercel Dashboard → **Add New…** → **Project**
- **Import Git Repository** → vyber svoj repozitár (napr. `Vzkřísení` / názov repo)
- Klikni **Import**

## 4. Nastavenie buildu (skontroluj)
Vercel by mal sám nastaviť:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** prázdne (ak je kód v koreni repo)

Ak niečo chýba, doplň to. Potom **Deploy**.

## 5. Premenné prostredia (voliteľné)
Ak aplikácia používa OpenAI (AI asistent):
- V projekte → **Settings** → **Environment Variables**
- Pridaj: **Name** `VITE_OPENAI_KEY`, **Value** `sk-proj-...` (tvoj kľúč)
- **Save** a sprav **Redeploy** (Deployments → … → Redeploy)

## 6. Hotovo
Po prvom deployi dostaneš URL typu:
**https://urban-analysis-app-xxx.vercel.app**

Ďalšie pushy do `main` spustia automatický deploy.
