# PWA Fixes Summary

## Issues Identified

### 1. Password Change & Profile Completion Flow ✅
**Problem:** Backend returns `mustChangePassword` but frontend expects `needs_password_change`

**Fix:** Update auth controller to return both flags in consistent format

### 2. Profile Photo Upload ❌
**Problem:** Endpoint `/staff/:id/upload-photo` doesn't exist in backend

**Fix:** Create upload endpoint in staff controller

### 3. Shift Management UI ❌
**Problem:** No proper shift assignment interface

**Fix:** Create shift list view with assignment flow

---

## Implementation Plan

### Backend Changes
1. Add profile photo upload endpoint
2. Return consistent user flags (`needs_password_change`, `needs_profile_completion`)
3. Add profile photo field to user/staff responses

### Frontend Changes  
1. Fix auth context to handle backend response format
2. Fix image upload to use correct endpoint
3. Create shift management screen with list view

---

Let me implement these fixes now.
