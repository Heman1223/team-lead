# 🔧 Fix Live Login Issue - Different Database

## The Problem

Your Render server uses a **different MongoDB database** than localhost.
- Local DB: Has admin user ✅
- Live DB (Render): No admin user ❌

## Solution: Create Admin on Live Database

### Option 1: Use Setup Route (Easiest) ⭐

**Step 1:** Make sure your latest code is deployed to Render

```bash
git add .
git commit -m "Add setup route"
git push origin main
```

Wait for Render to redeploy (~2-3 minutes)

**Step 2:** Visit this URL in your browser:

```
https://team-lead-4acd.onrender.com/api/setup/create-admin
```

You should see:
```json
{
  "success": true,
  "message": "Admin user created successfully!",
  "credentials": {
    "email": "admin@teamlead.com",
    "password": "admin123"
  }
}
```

**Step 3:** Try logging in at:
```
https://team-lead-gamma.vercel.app
```

---

### Option 2: Use Render Shell (Alternative)

If you have access to Render shell:

**Step 1:** Go to Render Dashboard
- Select your service: team-lead-4acd
- Click "Shell" tab

**Step 2:** Run this command:
```bash
node seedAdmin.js
```

---

### Option 3: MongoDB Atlas Direct (If needed)

If the setup route doesn't work:

**Step 1:** Find your Render MongoDB URI
1. Go to Render Dashboard
2. Select: team-lead-4acd
3. Go to: Environment tab
4. Find: MONGODB_URI value
5. Copy it

**Step 2:** Connect to MongoDB Atlas
1. Go to: https://cloud.mongodb.com/
2. Find the cluster from the URI
3. Click "Browse Collections"
4. Find the database name from URI
5. Look for "users" collection

**Step 3:** Check if admin exists
- Look for email: admin@teamlead.com
- If not found, you need to create it

**Step 4:** Create admin manually (if needed)
1. Click "Insert Document"
2. Use this JSON:
```json
{
  "name": "Admin User",
  "email": "admin@teamlead.com",
  "password": "$2a$10$YourHashedPasswordHere",
  "role": "admin",
  "status": "offline",
  "isActive": true,
  "createdAt": {"$date": "2026-01-22T00:00:00.000Z"},
  "updatedAt": {"$date": "2026-01-22T00:00:00.000Z"}
}
```

**Note:** You'll need to hash the password first. Use the setup route instead!

---

## Verification Steps

### Check 1: Is Setup Route Available?
```bash
curl https://team-lead-4acd.onrender.com/api/setup/create-admin
```

Expected: JSON response with success message

### Check 2: Can You Login?
1. Go to: https://team-lead-gamma.vercel.app
2. Try: admin@teamlead.com / admin123
3. Should work!

---

## If Setup Route Returns 404

The setup route might not be deployed yet. Deploy it:

**Step 1:** Verify the route is in your code
Check `server/src/index.js` has:
```javascript
{ path: "/api/setup", file: "./routes/setupRoutes", name: "Setup" },
```

**Step 2:** Push to GitHub
```bash
git add .
git commit -m "Add setup route for admin creation"
git push origin main
```

**Step 3:** Wait for Render to deploy
- Check Render dashboard
- Wait for "Live" status
- Try the setup URL again

---

## Quick Fix Commands

```bash
# 1. Ensure latest code is committed
git add .
git commit -m "Add setup route"

# 2. Push to trigger Render deployment
git push origin main

# 3. Wait 2-3 minutes for deployment

# 4. Create admin on live database
curl https://team-lead-4acd.onrender.com/api/setup/create-admin

# 5. Test login
# Go to: https://team-lead-gamma.vercel.app
# Login: admin@teamlead.com / admin123
```

---

## After Login Works

### Remove Setup Route (Security)

Once you confirm login works:

1. Edit `server/src/index.js`
2. Remove this line:
```javascript
{ path: "/api/setup", file: "./routes/setupRoutes", name: "Setup" },
```
3. Commit and push:
```bash
git add server/src/index.js
git commit -m "Remove setup route for security"
git push origin main
```

---

## Summary

**The Issue:** Different databases on local vs Render
**The Fix:** Create admin user on Render's database
**The Method:** Visit `/api/setup/create-admin` endpoint
**The Result:** Login works on live site! ✅

---

## Need Help?

If the setup route doesn't work:
1. Check Render logs for errors
2. Verify the route is deployed
3. Try accessing other endpoints first (like /health)
4. Let me know what error you see
