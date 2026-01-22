# 🚀 Live Deployment Login Issue - Fix Guide

## Problem
Login works on localhost but NOT on live deployment.

## Root Cause
Your live server is using a different MongoDB database that doesn't have the admin user created yet.

---

## Solution 1: Create Admin User on Live Server (Recommended)

### Option A: Run Seed Script on Live Server

If your server is deployed on **Render**, **Railway**, or **Heroku**:

1. **SSH into your live server** or use the platform's console
2. **Run the seed script:**
   ```bash
   cd server
   node seedAdmin.js
   ```

### Option B: Use MongoDB Atlas Directly

1. **Go to MongoDB Atlas:** https://cloud.mongodb.com/
2. **Select your cluster** (the one used by live deployment)
3. **Click "Browse Collections"**
4. **Find the `users` collection**
5. **Check if admin user exists:**
   - Look for email: `admin@teamlead.com`
   - If it doesn't exist, create it manually

### Option C: Create Admin via API (Easiest)

Create a temporary endpoint to create admin user:

**File:** `server/src/routes/setupRoutes.js` (create this file)

```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// TEMPORARY ROUTE - Remove after creating admin!
router.post('/create-admin', async (req, res) => {
    try {
        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@teamlead.com' });
        if (adminExists) {
            return res.json({ 
                success: true, 
                message: 'Admin already exists',
                email: 'admin@teamlead.com'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin
        await User.create({
            name: 'Admin User',
            email: 'admin@teamlead.com',
            password: hashedPassword,
            role: 'admin',
            status: 'offline',
            isActive: true
        });

        res.json({
            success: true,
            message: 'Admin user created successfully!',
            credentials: {
                email: 'admin@teamlead.com',
                password: 'admin123'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

module.exports = router;
```

**Then add to `server/src/index.js`:**

```javascript
// Add this with other route imports
const setupRoutes = require('./routes/setupRoutes');

// Add this with other routes
app.use('/api/setup', setupRoutes);
```

**Then visit:**
```
https://your-live-server.com/api/setup/create-admin
```

**IMPORTANT:** Remove this route after creating the admin!

---

## Solution 2: Check Environment Variables

Your live server might be using wrong environment variables.

### Check These on Your Live Server:

1. **MongoDB URI:**
   - Should point to the correct database
   - Check if it's the same as localhost or different

2. **JWT Secret:**
   - Should be set correctly

3. **CORS Settings:**
   - Should allow your live frontend URL

### Where to Check:

**Render:**
- Dashboard → Your Service → Environment

**Railway:**
- Project → Variables

**Heroku:**
- App → Settings → Config Vars

**Vercel (for server):**
- Project → Settings → Environment Variables

---

## Solution 3: Database Connection Issue

### Verify Database Connection:

1. **Check MongoDB Atlas:**
   - Go to: https://cloud.mongodb.com/
   - Check "Network Access"
   - Make sure `0.0.0.0/0` is allowed (or your server's IP)

2. **Check Database Name:**
   - Your live server might be connecting to a different database
   - Check the MongoDB URI in live environment

3. **Check Connection String:**
   ```
   mongodb+srv://TeamLead:Team31@cluster0.jknldip.mongodb.net/?appName=Cluster0
   ```
   - This should be the same on live server

---

## Quick Diagnostic Steps

### Step 1: Check if Server is Running
Visit: `https://your-live-server.com/health`

Expected response:
```json
{"status":"Server is running","timestamp":"..."}
```

### Step 2: Check Auth Endpoint
Visit: `https://your-live-server.com/api/auth/test`

Expected response:
```json
{"success":true,"message":"✓ Auth routes are working!"}
```

### Step 3: Check Database Connection
Look at your live server logs for:
```
✓ MongoDB Connected
```

### Step 4: Try Creating Admin
Use the setup route (Solution 1, Option C above)

---

## Common Issues & Fixes

### Issue 1: "Invalid credentials" on live
**Cause:** Admin user doesn't exist in live database  
**Fix:** Run seedAdmin.js on live server or use setup route

### Issue 2: "Cannot connect to database"
**Cause:** MongoDB Atlas network access or wrong URI  
**Fix:** Check MongoDB Atlas network access settings

### Issue 3: "CORS error"
**Cause:** Live frontend URL not allowed  
**Fix:** Update CORS_ORIGIN in live server environment variables

### Issue 4: "Server not responding"
**Cause:** Server not deployed or crashed  
**Fix:** Check deployment logs and redeploy

---

## Recommended Approach

**For fastest fix:**

1. **Create the setup route** (Solution 1, Option C)
2. **Deploy your server** with the new route
3. **Visit** `https://your-live-server.com/api/setup/create-admin`
4. **Try logging in** with admin@teamlead.com / admin123
5. **Remove the setup route** and redeploy

---

## Environment Variables Checklist

Make sure these are set on your live server:

```env
PORT=5001
MONGODB_URI=mongodb+srv://TeamLead:Team31@cluster0.jknldip.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
FRONTEND_URL=https://your-live-frontend.vercel.app
CORS_ORIGIN=https://your-live-frontend.vercel.app
SENDGRID_API_KEY=SG.your-key
SENDGRID_FROM_EMAIL=pikabhu31st@gmail.com
NOTIFICATION_EMAIL=sohamdang0@gmail.com
```

---

## Need More Help?

Tell me:
1. Where is your server deployed? (Render, Railway, Heroku, Vercel, etc.)
2. What's your live server URL?
3. What error do you see in the browser console?
4. What do the server logs show?

I'll help you fix it! 🚀
