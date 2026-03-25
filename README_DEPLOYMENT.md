# 📦 Femtech HR PWA - Deployment Package

**Employee Self-Service Portal**  
**URL:** https://hrapp.tripa.com.ng  
**Version:** 1.0.0

---

## 🚀 Quick Deploy to cPanel

### 1. Create Node.js App
In cPanel → Setup Node.js App → **Create Application**:

| Field | Value |
|-------|-------|
| Node.js version | `20.19.4` |
| Application mode | `Production` |
| Application root | `hrapp.tripa.com.ng` |
| Application URL | `https://hrapp.tripa.com.ng` |
| Startup file | `server.js` |

### 2. Upload Files
Upload ALL to `/home/[username]/hrapp.tripa.com.ng/`:

```
✅ server.js
✅ package.json
✅ .env
✅ dist/ (entire folder)
```

### 3. Install & Start
```bash
cd /home/[username]/hrapp.tripa.com.ng
npm install --production
```

Then click **Restart** in cPanel

---

## 📱 What's Included

| File/Folder | Description |
|-------------|-------------|
| `server.js` | Express server entry point |
| `package.json` | Dependencies (express included) |
| `.env` | Environment variables |
| `dist/` | Production build (PWA ready) |
| `DEPLOYMENT_GUIDE.md` | Full deployment instructions |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist |
| `PRODUCTION_READY.md` | Summary of changes |

---

## ✅ PWA Features

- **Service Worker:** ✅ Auto-updating
- **Manifest:** ✅ Generated (`manifest.webmanifest`)
- **Offline Support:** ✅ Cached assets
- **Mobile Ready:** ✅ iOS & Android
- **Install Prompt:** ✅ Add to Home Screen

### Install PWA
1. Open https://hrapp.tripa.com.ng on mobile
2. Tap "Add to Home Screen"
3. App installs as standalone PWA

---

## 🔧 Environment Variables

```env
NODE_ENV=production
VITE_API_BASE_URL=https://hrapi.tripa.com.ng/api
DOMAIN=tripa.com.ng
```

---

## ✅ Verification

After deployment, visit: **https://hrapp.tripa.com.ng**

Expected:
- Login page with "Femtech HR - Staff Portal"
- PWA manifest loads
- Service worker registers
- Mobile-responsive UI
- Working authentication

---

## 📞 Support

For detailed instructions:
- `DEPLOYMENT_GUIDE.md` - Complete guide
- `DEPLOYMENT_CHECKLIST.md` - Quick checklist

---

**Build Date:** March 25, 2026  
**Framework:** React + Vite + PWA  
**Server:** Express 4  
**Status:** ✅ Production Ready
