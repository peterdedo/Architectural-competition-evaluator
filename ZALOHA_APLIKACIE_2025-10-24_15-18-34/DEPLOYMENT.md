# 🚀 Urban Analytics - Deployment Guide

Kompletní návod na nasazení Urban Analytics aplikace do produkce.

---

## 📋 Obsah

1. [Prerekvizity](#prerequisites)
2. [Development Setup](#development-setup)
3. [Production Build](#production-build)
4. [Lokální Produkční Testing](#local-production-testing)
5. [VPS Deployment](#vps-deployment)
6. [Environment Configuration](#environment-configuration)
7. [OpenAI API Setup](#openai-api-setup)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Hardware
- **Minimum:** 2GB RAM, 1 vCPU
- **Recommended:** 4GB RAM, 2+ vCPU (pro clustering)

### Software
- Node.js 18+ 
- npm 8+
- Ubuntu 22.04 LTS (pro VPS)
- PM2 (global, pro process management)

### Setup
```bash
# Ověř verze
node --version    # v18.0.0 nebo vyšší
npm --version     # 8.0.0 nebo vyšší

# Instaluj PM2 globálně
sudo npm install -g pm2
pm2 --version
```

---

## Development Setup

### 1. Klonuj projekt a instaluj dependencies

```bash
git clone https://github.com/your-username/urban-analytics.git
cd urban-analytics
npm install
```

### 2. Vytvoř `.env` soubor

```bash
# Zkopíruj template
cp .env.example .env

# Edituj .env s tvými credentials
nano .env
```

**Požadované proměnné:**
```env
VITE_OPENAI_KEY=sk-proj-your-api-key
VITE_API_BASE_URL=http://localhost:5181
VITE_ENABLE_AI_FEATURES=true
NODE_ENV=development
PORT=5181
```

### 3. Spusť dev server

```bash
npm run dev
# ➜ Local: http://localhost:5181
```

---

## Production Build

### 1. Builduj aplikaci

```bash
npm run build
# Vytvoří: ./dist/
```

### 2. Ověř build

```bash
# Zkontroluj dist folder
ls -la dist/

# Měl by obsahovat:
# - index.html
# - assets/ (CSS, JS, images)
```

### 3. Instaluj production dependencies

```bash
npm install --production
# Nebo: npm ci --omit=dev
```

---

## Lokální Produkční Testing

### Start production serveru lokálně

```bash
# Build
npm run build

# Spusť server
npm run start

# Ověř: http://localhost:3000
```

### Test s PM2 (lokálně)

```bash
# Start s PM2
pm2 start server.js --name "urban-analytics-local"

# Ověř status
pm2 status
pm2 logs urban-analytics-local

# Stop
pm2 stop urban-analytics-local
pm2 delete urban-analytics-local
```

---

## VPS Deployment

### 1. Připoj se na VPS

```bash
ssh ubuntu@your-vps-ip
```

### 2. Instaluj Node.js a PM2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Instaluj Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Instaluj PM2
sudo npm install -g pm2
pm2 startup
pm2 save
```

### 3. Upload aplikace

**Option A: Git (doporučeno)**
```bash
cd /var/www
sudo mkdir -p urban-analytics
sudo chown ubuntu:ubuntu urban-analytics
cd urban-analytics
git clone https://github.com/your-username/urban-analytics.git .
```

**Option B: rsync (ze svého PC)**
```bash
# Na lokálním PC:
rsync -avz --exclude 'node_modules' --exclude '.git' \
  . ubuntu@your-vps-ip:/var/www/urban-analytics/
```

### 4. Konfigurace na VPS

```bash
cd /var/www/urban-analytics

# Instaluj dependencies
npm install --production

# Vytvoř .env
cp .env.example .env
nano .env
# Vlož VITE_OPENAI_KEY a ostatní values

# Build aplikace
npm run build
```

### 5. Spusť s PM2

```bash
# Start aplikace
pm2 start ecosystem.config.js --env production

# Ověř status
pm2 status
pm2 logs urban-analytics

# Nastavit auto-restart na boot
pm2 startup
pm2 save
```

### 6. Konfigurace Nginx (reverse proxy)

```bash
# Instaluj Nginx
sudo apt install nginx -y

# Vytvoř config
sudo nano /etc/nginx/sites-available/urban-analytics
```

**Obsah `/etc/nginx/sites-available/urban-analytics`:**
```nginx
upstream urban_analytics {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;

    # Proxy settings
    location / {
        proxy_pass http://urban_analytics;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 7. Enable Nginx config

```bash
sudo ln -s /etc/nginx/sites-available/urban-analytics \
  /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 8. SSL Certificate (Let's Encrypt)

```bash
# Instaluj Certbot
sudo apt install certbot python3-certbot-nginx -y

# Vygeneruj certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify
sudo certbot certificates
```

---

## Environment Configuration

### Production `.env` Template

```env
# === REQUIRED ===
VITE_OPENAI_KEY=sk-proj-xxxxx-your-actual-key

# === URLS ===
VITE_API_BASE_URL=https://your-domain.com
VITE_APP_NAME=Urban Analytics

# === FEATURES ===
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_PDF_EXPORT=true
VITE_ENABLE_HEATMAP=true

# === SERVER ===
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# === LOGGING ===
VITE_LOG_LEVEL=warn
VITE_ENABLE_SENTRY=false
```

### Bezpečnostní Tipy
- **NIKDY** nedávej `.env` do Gitu
- Ulož API klíč v secure password manager
- Rotuj API klíče každé 3 měsíce
- Monitoruj usage na OpenAI dashboard

---

## OpenAI API Setup

### 1. Vytvoř API klíč

1. Jdi na https://platform.openai.com/api-keys
2. Klikni "Create new secret key"
3. Zkopíruj klíč (ukazuje se jen jednou!)
4. Vlož do `.env`: `VITE_OPENAI_KEY=sk-proj-...`

### 2. Nastav usage limits

```
OpenAI Dashboard → Billing → Usage limits
- Set monthly limit: $50 (nebo tvoje preference)
- Set soft limit: $40 (dostaneš alert)
```

### 3. Ověř API funkčnost

```bash
# Na serveru, po nastavení .env
curl -X GET http://localhost:3000/api/config

# Měl by vrátit:
# { "enableAI": true, ... }
```

---

## Monitoring & Maintenance

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Show logs
pm2 logs urban-analytics

# Show errors
pm2 logs urban-analytics --err

# Save logs to file
pm2 logs urban-analytics > urban-analytics.log 2>&1
```

### System Monitoring

```bash
# CPU & Memory
top
free -h

# Disk usage
df -h

# Check ports
netstat -tulpn | grep LISTEN
```

### Database Backup (pokud se přidá)

```bash
# Zálohuj data
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/urban-analytics

# Upload na Cloud
# (AWS S3, Google Drive, GitHub, apod.)
```

### Update Aplikace

```bash
cd /var/www/urban-analytics

# Pull latest code
git pull origin main

# Instaluj deps
npm install --production

# Build
npm run build

# Restart
pm2 restart urban-analytics
```

---

## Troubleshooting

### Aplikace se nespustí

```bash
# 1. Kontroluj logy
pm2 logs urban-analytics --err

# 2. Ověř .env soubor
cat .env | grep VITE_OPENAI_KEY

# 3. Zkus ruční start
NODE_ENV=production node server.js

# 4. Zkontroluj port
sudo lsof -i :3000
```

### OpenAI API Error

```bash
# Ověř API klíč
echo $VITE_OPENAI_KEY

# Zkus API call manuálně
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $VITE_OPENAI_KEY"
```

### Nginx Connection Refused

```bash
# 1. Ověř, že app běží
pm2 status

# 2. Zkontroluj Nginx config
sudo nginx -t

# 3. Zkus přímo na port 3000
curl http://localhost:3000

# 4. Restart Nginx
sudo systemctl restart nginx
```

### High Memory Usage

```bash
# 1. Zkontroluj memory
pm2 show urban-analytics

# 2. Nastav limit v ecosystem.config.js
max_memory_restart: '500M'

# 3. Reload config
pm2 reload ecosystem.config.js --env production
```

### SSL Certificate Issues

```bash
# Ověř certifikát
sudo certbot certificates

# Obnovit certifikát
sudo certbot renew --dry-run

# Manuální renew
sudo certbot renew --force-renewal
```

---

## Performance Tips

### 1. Komprese

Nginx (v config výše) již má `gzip` zapnutou.

### 2. Caching

```nginx
# Statické soubory - cache 1 rok
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
}
```

### 3. CDN (volitelné)

```
Doporučuji: Cloudflare (free tier)
- Automatic SSL
- CDN (global)
- DDoS protection
```

### 4. Database (pokud bude)

- Připoj se přes SSH tunnel
- Backupuj pravidelně
- Monitoruj performance

---

## Security Checklist

- [ ] `.env` v `.gitignore`
- [ ] SSH keys (ne hesla)
- [ ] Firewall configured (UFW)
- [ ] SSL certificate (HTTPS)
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Update OS & packages
- [ ] API rate limiting

---

## Support & Resources

- **PM2 Docs:** https://pm2.keymetrics.io/
- **Nginx Docs:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/
- **OpenAI API:** https://platform.openai.com/docs

---

**Poslední update:** 2025-10-22
**Status:** Production Ready ✅

