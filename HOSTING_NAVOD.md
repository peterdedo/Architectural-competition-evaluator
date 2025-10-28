# Hosting Urban Analytics – prehľad možností

Aplikácia je Vite + React. Môžeš ju hostovať **iba ako statické súbory** (najjednoduchšie) alebo **s Node serverom** (ak potrebuješ `/api/health` alebo ďalší backend).

---

## Možnosť 1: Vercel (odporúčané – najrýchlejšie)

**Výhody:** Free tier, automatický deploy z Gitu, HTTPS, vhodné pre Vite.

### Kroky

1. **Účet:** [vercel.com](https://vercel.com) → Sign up (môžeš cez GitHub).
2. **Projekt na GitHube:** Ak ešte nemáš repozitár, vytvor ho na GitHub.com a pushni projekt.
3. **Import na Vercel:**
   - Vercel → **Add New** → **Project**
   - Import z GitHubu → vyber repozitár s projektom
   - **Framework Preset:** Vite (Vercel to väčšinou sám rozpozná)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Root Directory:** nechaj prázdne (alebo `./` ak je projekt v podpriečinku)
4. **Premenné prostredia (ak používaš OpenAI v kliente):**
   - V projekte → **Settings** → **Environment Variables**
   - Pridaj napr. `VITE_OPENAI_KEY` (Value = tvoj kľúč)
5. **Deploy:** Klikni **Deploy**. Po buildu dostaneš URL typu `tvoj-projekt.vercel.app`.

**Poznámka:** Na Vercel beží len statický build (súbory z `dist`). `server.js` sa nespúšťa – endpoint `/api/health` nebude. Pre čisto klientskú aplikáciu to stačí.

---

## Možnosť 2: Netlify

**Výhody:** Free tier, drag & drop alebo Git, jednoduchý dashboard.

1. [netlify.com](https://www.netlify.com) → Sign up.
2. **Deploy:** **Add new site** → **Import an existing project** → GitHub → vyber repozitár.
3. **Nastavenie buildu:**
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Premenné:** **Site settings** → **Environment variables** → pridaj `VITE_OPENAI_KEY` atď.
5. Každý push do Gitu spustí nový deploy.

---

## Možnosť 3: Cloudflare Pages

**Výhody:** Veľmi rýchla CDN, free tier, Git alebo priamy upload.

1. [pages.cloudflare.com](https://pages.cloudflare.com) → **Create a project** → **Connect to Git** (GitHub).
2. **Build settings:**
   - Framework preset: None (alebo Vite, ak je v zozname)
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Env vars:** V nastaveniach projektu pridaj `VITE_OPENAI_KEY` atď.

---

## Možnosť 4: Hosting so serverom (Node.js)

Ak chceš behať celý `server.js` (Express, `/api/health` atď.):

### Railway / Render

- **Railway:** [railway.app](https://railway.app) – pripojíš GitHub, nastavíš **Start Command** napr. `node server.js` (alebo `npm run build && node server.js`). Potrebuješ v projekte `"start": "node server.js"` v `package.json` a build krok.
- **Render:** [render.com](https://render.com) – **New Web Service** → GitHub → Build: `npm install && npm run build`, Start: `node server.js`. Nastavíš env premenné v dashboarde.

### VPS (vlastný server)

Podrobný postup máš v **DEPLOYMENT.md**: VPS (Ubuntu), Node.js, PM2, Nginx, Let’s Encrypt. Vhodné ak chceš plnú kontrolu alebo vlastnú doménu bez obmedzení platformy.

---

## Súhrn – čo zvoliť

| Potreba | Odporúčanie |
|--------|-------------|
| Rýchlo online, zadarmo, len front-end | **Vercel** alebo **Netlify** |
| Rýchlo + CDN zadarmo | **Cloudflare Pages** |
| Beží aj Node server (API) | **Railway** alebo **Render** |
| Vlastný server, plná kontrola | **VPS** podľa DEPLOYMENT.md |

Pre väčšinu prípadov stačí **Vercel**: prepojíš GitHub, nastavíš build a env premenné a aplikácia bude na adrese typu `https://tvoj-projekt.vercel.app`.
