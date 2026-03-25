# ✅ PWA Deployment Checklist - hrapp.tripa.com.ng

## 📋 Quick Reference

**Application:** Femtech HR PWA (Employee Portal)  
**URL:** https://hrapp.tripa.com.ng  
**Startup File:** server.js  
**Build Output:** dist/  
**Node Version:** 20.x

---

## 🎯 cPanel Setup

### Create Node.js App
- [ ] Node.js version: **20.19.4**
- [ ] Application mode: **Production**
- [ ] Application root: **hrapp.tripa.com.ng**
- [ ] Application URL: **https://hrapp.tripa.com.ng**
- [ ] Startup file: **server.js**
- [ ] Click **Create**

---

## 📦 Upload Files

### Required Files (upload to hrapp.tripa.com.ng/)
- [ ] `server.js` - Express entry point
- [ ] `package.json` - Dependencies
- [ ] `.env` - Environment variables
- [ ] `dist/` - Production build folder

### DO NOT Upload
- [ ] ❌ node_modules/
- [ ] ❌ src/
- [ ] ❌ .git/
- [ ] ❌ guidelines/

---

## 🔧 Server Setup

### Install Dependencies
```bash
cd /home/[username]/hrapp.tripa.com.ng
npm install --production
```
- [ ] Dependencies installed

### Environment Variables
Create `.env` file:
```env
NODE_ENV=production
VITE_API_BASE_URL=https://hrapi.tripa.com.ng/api
DOMAIN=tripa.com.ng
```
- [ ] .env file created

### Restart Application
- [ ] Click **Restart** in cPanel
- [ ] Wait 10-15 seconds
- [ ] Check logs: "✅ Femtech HR PWA is running on port XXXX"

---

## ✅ Verification

### Basic Tests
- [ ] Visit https://hrapp.tripa.com.ng
- [ ] Login page loads
- [ ] No console errors
- [ ] Styles load correctly

### PWA Tests
- [ ] Manifest loads: https://hrapp.tripa.com.ng/manifest.json
- [ ] Service worker registered
- [ ] "Add to Home Screen" works
- [ ] App installs as standalone

### API Tests
- [ ] Login succeeds
- [ ] API calls to https://hrapi.tripa.com.ng/api
- [ ] No CORS errors
- [ ] Dashboard loads

### Mobile Tests
- [ ] Responsive on mobile
- [ ] Touch interactions work
- [ ] No horizontal scroll
- [ ] PWA installs on iOS/Android

---

## 🐛 Troubleshooting

### If App Won't Start
```bash
cat logs/error.log
node --version
```

### If 404 Errors
- Check server.js is startup file
- Verify dist/ folder exists
- Restart application

### If API Fails
- Check VITE_API_BASE_URL
- Verify backend is running
- Test: curl https://hrapi.tripa.com.ng/api/system-complete/readiness

---

## 📊 Post-Deployment

### Monitor
- [ ] Check logs first 24 hours
- [ ] Monitor error rate
- [ ] Check API response times

### Document
- [ ] Share URL with team
- [ ] Document login credentials
- [ ] Create user guide if needed

---

**Deployed:** _______________  
**By:** _______________  
**Status:** ✅ Complete
