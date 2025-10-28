# ⚡ QUICK START - URBAN ANALYTICS DEPLOYMENT

Rýchly návod na deployment Urban Analytics za 15 minút.

---

## 📋 CHECKLIST PRED ZAČATÍM

- [ ] VPS s Ubuntu 22.04 (min. 2GB RAM)
- [ ] Root/sudo prístup
- [ ] SSH prístup
- [ ] Doména + DNS nastavené (voliteľné)
- [ ] Deployment skripty nahrané na server

---

## 🚀 DEPLOYMENT V 5 KROKOCH

### 1️⃣ PRIPOJENIE A PRÍPRAVA

```bash
# Pripojte sa na VPS
ssh root@your-vps-ip

# Upload deployment skriptov
cd /tmp
# Použite scp/git/manual upload

# Nastavte permissions
cd deployment
chmod +x *.sh
```

---

### 2️⃣ INITIAL SETUP (5 min)

```bash
# Spustite initial setup
sudo ./01-initial-setup.sh

# ⚠️ PO DOKONČENÍ:
# Spustite príkaz, ktorý vypíše PM2 (začína s "sudo env PATH=...")
# Príklad:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

### 3️⃣ UPLOAD APLIKÁCIE (2 min)

**Option A: Git**
```bash
cd /var/www/urban-analytics
git clone your-repo-url .
```

**Option B: SCP (z lokálneho PC)**
```bash
# Na vašom PC:
cd urban-analysis-vite
rsync -avz --exclude 'node_modules' . user@your-vps-ip:/var/www/urban-analytics/
```

---

### 4️⃣ BUILD & DEPLOY (3 min)

```bash
cd /tmp/deployment
sudo ./02-build-app.sh

# Overte:
pm2 status
pm2 logs urban-analytics
curl http://localhost:3000
```

---

### 5️⃣ NGINX & SSL (5 min)

**A) Konfigurácia Nginx**
```bash
# Upravte doménu
nano 03-configure-nginx.sh
# Zmeňte: DOMAIN="your-domain.com"

# Spustite
sudo ./03-configure-nginx.sh

# Test
curl http://your-domain.com
```

**B) SSL Setup (iba ak máte doménu)**
```bash
# ⚠️ PRED SPUSTENÍM:
# - DNS A záznam musí smerovať na VPS IP
# - Počkajte 5-10 min na DNS propagáciu
# Test: ping your-domain.com

# Upravte konfiguráciu
nano 04-setup-ssl.sh
# Zmeňte:
# DOMAIN="your-domain.com"
# EMAIL="your@email.com"

# Spustite
sudo ./04-setup-ssl.sh

# Test
curl -I https://your-domain.com
```

---

## ✅ HOTOVO!

Aplikácia je teraz prístupná:

**Cez IP:**
```
http://your-vps-ip
```

**Cez doménu:**
```
https://your-domain.com
```

---

## 📊 ZÁKLADNÉ PRÍKAZY

### Status check
```bash
pm2 status
sudo systemctl status nginx
```

### Logy
```bash
pm2 logs urban-analytics
sudo tail -f /var/log/nginx/urban-analytics.access.log
```

### Reštart
```bash
pm2 restart urban-analytics
sudo systemctl reload nginx
```

---

## 🔧 AK NIEČO NEFUNGUJE

### App sa nespustí
```bash
pm2 logs urban-analytics --err
cd /var/www/urban-analytics && node server.js
```

### Nginx chyba
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Port je obsadený
```bash
sudo lsof -i :3000
sudo kill -9 [PID]
pm2 restart urban-analytics
```

### SSL certifikát nefunguje
```bash
# Skontrolujte DNS
nslookup your-domain.com

# Test certbot
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## 📱 PRÍSTUP PRE POUŽÍVATEĽOV

Po úspešnom deployment zdieľajte link:

**Pre verejný prístup:**
```
https://your-domain.com
```

**Pre testovanie (dočasné):**
```
http://your-vps-ip:80
```

---

## 🔄 AKTUALIZÁCIA APLIKÁCIE

```bash
cd /var/www/urban-analytics
git pull
npm install
npm run build
cp -r dist/* /var/www/urban-analytics-production/
pm2 restart urban-analytics
```

---

## 📚 ĎALŠIE ZDROJE

- **Kompletný guide**: `README-DEPLOYMENT.md`
- **Monitoring príkazy**: `05-monitoring-commands.sh`
- **Backup/Restore**: `06-backup-restore.sh`

---

**Problém?** Pozrite `README-DEPLOYMENT.md` → sekciu TROUBLESHOOTING

**Need help?** Spustite: `./05-monitoring-commands.sh`


