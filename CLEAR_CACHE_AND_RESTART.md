# FIX: Clear All Caches and Restart

## I've cleared the server-side caches. Now do this:

### Step 1: Close Browser Completely
- Close ALL browser tabs and windows
- Make sure Chrome/Edge is completely closed

### Step 2: Clear Browser Cache
When you reopen browser:
- Press `Ctrl + Shift + Delete`
- Select "Cached images and files"
- Time range: "All time"
- Click "Clear data"

### Step 3: Restart Client Dev Server
In your client terminal:
```bash
# Stop the current server (Ctrl+C)
# Then run:
cd client
npm run dev
```

### Step 4: Test Again
1. Open browser in INCOGNITO/PRIVATE mode: `Ctrl + Shift + N`
2. Go to `localhost:5173`
3. Login
4. Go to Leads
5. Click on a lead
6. Click "Schedule Follow-Up"
7. Select a title from dropdown
8. Pick a date
9. Click Schedule

## Why This Happens:
Your browser cached the OLD JavaScript code that had `type: 'follow_up'`. Even though the server code is fixed, your browser keeps using the old cached file.

## What I Fixed:
✓ Cleared `client/dist` folder
✓ Cleared `client/node_modules/.vite` cache
✓ Server already has correct code (type enum: call, email, meeting, demo, proposal, other)
✓ Client code is correct (sends type: 'call' by default)

The error will disappear once you clear browser cache!
