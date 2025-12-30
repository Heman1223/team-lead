# Lead Management System - Complete Testing Guide

## Prerequisites
- Server running on `http://localhost:5001`
- Client running on `http://localhost:5173`
- Admin user logged in
- At least 2-3 team members created

## Test 1: Create a New Lead

### Steps:
1. **Navigate to Lead Management**
   - Click "Lead Management" in sidebar
   - Should see Dashboard tab active

2. **Click "New Lead" Button**
   - Orange button in top-right
   - Modal should open with clean white design

3. **Fill in Lead Information**
   - **Client Name**: "Test Client 1"
   - **Email**: "testclient1@example.com"
   - **Phone**: "+1 (555) 123-4567"
   - **Category**: Select "Web Development"
   - **Estimated Value**: 5000
   - **Expected Close Date**: Pick a future date
   - **Source**: Select "Manual Entry"
   - **Priority**: Select "High"
   - **Inquiry Message**: "Looking for a new website"
   - **Internal Notes**: "Hot lead, follow up soon"

4. **Assignment (Admin/Team Lead only)**
   - **Assign to Team**: Select a team (optional)
   - **Assign to User**: Select a user (optional)

5. **Click "Create Lead"**
   - Should see success (no error)
   - Modal should close
   - Dashboard should refresh automatically

### Expected Results:
- ✅ Lead created successfully
- ✅ Dashboard "Total Leads" count increases by 1
- ✅ Lead appears in "All Leads" tab
- ✅ Lead status is "New"
- ✅ Pipeline value increases by $5,000

---

## Test 2: View Lead Details

### Steps:
1. **Go to "All Leads" Tab**
   - Click "All Leads" tab
   - Should see list of lead cards

2. **Click on a Lead Card**
   - Click on "Test Client 1" card
   - Lead detail modal should open

3. **Verify Information Displayed**
   - ✅ Client name in orange header
   - ✅ Email and phone displayed
   - ✅ Status dropdown showing current status
   - ✅ Assigned To dropdown (if assigned)
   - ✅ Category, Estimated Value, Source, Priority
   - ✅ Description/Notes
   - ✅ Activity Timeline (should show "Lead Created")

### Expected Results:
- ✅ All information displays correctly
- ✅ Modal is clean white design
- ✅ Activity timeline shows creation event

---

## Test 3: Update Lead Status

### Steps:
1. **Open Lead Detail Modal**
   - Click on any lead card

2. **Change Status**
   - Click "Status" dropdown
   - Select "Contacted"
   - Wait for update

3. **Verify Update**
   - Status should change immediately
   - Activity timeline should show new entry: "Status changed"
   - Close modal

4. **Check Dashboard**
   - Go to Dashboard tab
   - "Lead Status" section should update
   - "Contacted" count should increase

### Expected Results:
- ✅ Status updates successfully
- ✅ Activity logged in timeline
- ✅ Dashboard reflects change
- ✅ No errors

---

## Test 4: Assign Lead to User

### Steps:
1. **Open Lead Detail Modal**
   - Click on an unassigned lead

2. **Assign to User**
   - Click "Assigned To" dropdown
   - Select a user (e.g., "Heman")
   - Wait for update

3. **Verify Assignment**
   - Dropdown should show selected user
   - Activity timeline should show "Lead assigned"
   - Close modal

4. **Check as Assigned User**
   - Logout
   - Login as the assigned user
   - Go to Lead Management
   - Should see the assigned lead

### Expected Results:
- ✅ Lead assigned successfully
- ✅ Activity logged
- ✅ Assigned user can see the lead
- ✅ Other users cannot see it (if team member)

---

## Test 5: Schedule Follow-Up

### Steps:
1. **Open Lead Detail Modal**
   - Click on any lead card

2. **Click "Schedule Follow-Up" Button**
   - Blue button below header
   - Follow-up modal should open

3. **Fill Follow-Up Form**
   - **Title**: Select "Follow-up call" from dropdown
   - **Date**: Pick tomorrow's date
   - **Time**: Select "10:00 AM"
   - **Priority**: Select "High"

4. **Click "Schedule"**
   - Should see "Follow-up scheduled successfully!" alert
   - Modal should close
   - Lead detail should refresh

5. **Verify Follow-Up Created**
   - Go to Dashboard tab
   - Check "Upcoming Follow-Ups" section
   - Should see your follow-up listed with:
     - Title: "Follow-up call"
     - Lead name
     - Assigned user name
     - Date and time
     - Priority badge (orange for High)

### Expected Results:
- ✅ Follow-up created successfully
- ✅ Appears in "Upcoming Follow-Ups"
- ✅ Shows correct information
- ✅ Assigned user can see it

---

## Test 6: Complete Follow-Up

### Steps:
1. **Go to Dashboard**
   - Should see follow-up in "Upcoming Follow-Ups"

2. **Click Green Checkmark Icon**
   - On the follow-up card
   - Follow-up should be marked complete

3. **Verify Completion**
   - Follow-up should disappear from list
   - Or status should change to "Completed"

### Expected Results:
- ✅ Follow-up marked complete
- ✅ Removed from upcoming list
- ✅ Activity logged

---

## Test 7: Dashboard Statistics

### Steps:
1. **Go to Dashboard Tab**
   - Should see 4 stat cards at top

2. **Verify Statistics**
   - **Total Leads**: Count all your leads
   - **Converted**: Count leads with "Converted" status
   - **Conversion Rate**: Should be (Converted / Total) × 100
   - **Pipeline Value**: Sum of all estimated values

3. **Create New Lead**
   - Create a lead with $10,000 value
   - Dashboard should auto-refresh
   - Total Leads should increase by 1
   - Pipeline Value should increase by $10,000

4. **Convert a Lead**
   - Open a lead
   - Change status to "Converted"
   - Dashboard should update
   - Converted count should increase
   - Conversion rate should recalculate

### Expected Results:
- ✅ All statistics accurate
- ✅ Auto-refresh after changes
- ✅ Calculations correct

---

## Test 8: Lead Status Distribution

### Steps:
1. **Go to Dashboard**
   - Look at "Lead Status" section

2. **Verify Display**
   - Should show all statuses with counts
   - Progress bars showing percentages
   - Colors: Blue (New), Yellow (Contacted), Purple (Interested), Orange (Follow-up), Green (Converted), Red (Not Interested)

3. **Create Leads with Different Statuses**
   - Create 3 new leads
   - Set different statuses
   - Check if distribution updates

4. **Test Scrolling**
   - If many statuses, section should scroll
   - Height should stay fixed (max-h-80)

### Expected Results:
- ✅ All statuses displayed
- ✅ Counts and percentages correct
- ✅ Colors match status
- ✅ Scrollable if needed

---

## Test 9: Team Performance (Admin/Team Lead Only)

### Steps:
1. **Login as Admin**
   - Go to Dashboard

2. **Verify Team Performance Table**
   - Should see "Team Performance" section
   - Table with columns: Name, Total Leads, Converted, Rate, Pipeline Value

3. **Check Data**
   - Each team member should have a row
   - Ranked by conversion rate
   - Numbers should match their actual leads

4. **Test Scrolling**
   - If more than 4 team members, table should scroll
   - Header should stay visible (sticky)
   - Height should stay fixed

### Expected Results:
- ✅ All team members listed
- ✅ Statistics accurate
- ✅ Sorted by conversion rate
- ✅ Scrollable if needed
- ✅ Sticky header works

---

## Test 10: Lead Sources

### Steps:
1. **Go to Dashboard**
   - Look at "Lead Sources" section

2. **Verify Sources**
   - Should show count for each source
   - Manual, Website, LinkedIn, Referral, etc.

3. **Create Leads from Different Sources**
   - Create lead with source "LinkedIn"
   - Create lead with source "Referral"
   - Check if counts update

### Expected Results:
- ✅ All sources displayed
- ✅ Counts accurate
- ✅ Updates after new leads

---

## Test 11: Search and Filter Leads

### Steps:
1. **Go to "All Leads" Tab**
   - Should see search bar and filters

2. **Test Search**
   - Type client name in search
   - Should filter leads instantly
   - Try email search
   - Try phone search

3. **Test Status Filter**
   - Select "Converted" from status filter
   - Should show only converted leads
   - Select "All" to reset

4. **Test Priority Filter**
   - Select "High" priority
   - Should show only high priority leads

### Expected Results:
- ✅ Search works instantly
- ✅ Filters work correctly
- ✅ Can combine search and filters
- ✅ Reset works

---

## Test 12: Import Leads (Admin Only)

### Steps:
1. **Prepare CSV File**
   - Create file with columns: client_name, email, phone, category
   - Add 3-5 test leads

2. **Go to "Import Leads" Tab**
   - Should see step-by-step wizard

3. **Upload CSV**
   - Click upload area or browse
   - Select your CSV file
   - Should show preview

4. **Review and Import**
   - Check preview data
   - Click "Import Leads"
   - Should see success message

5. **Verify Import**
   - Go to "All Leads" tab
   - Should see imported leads
   - Dashboard should update

### Expected Results:
- ✅ CSV uploads successfully
- ✅ Preview shows correct data
- ✅ Import completes
- ✅ Leads appear in system
- ✅ Dashboard updates

---

## Test 13: Delete Lead (Admin Only)

### Steps:
1. **Login as Admin**
   - Open any lead detail

2. **Click "Delete" Button**
   - Red button in lead detail
   - Should see confirmation dialog

3. **Confirm Deletion**
   - Click "Yes" or "Delete"
   - Should see success message
   - Modal should close

4. **Verify Deletion**
   - Lead should not appear in "All Leads"
   - Dashboard count should decrease
   - (Soft delete - can be recovered within 60 days)

### Expected Results:
- ✅ Confirmation dialog appears
- ✅ Lead deleted successfully
- ✅ Removed from lists
- ✅ Dashboard updates

---

## Test 14: Role-Based Access

### Test as Admin:
- ✅ Can see all leads
- ✅ Can create leads
- ✅ Can assign leads to anyone
- ✅ Can delete leads
- ✅ Can see team performance
- ✅ Can import leads

### Test as Team Lead:
- ✅ Can see team's leads
- ✅ Can create leads
- ✅ Can assign to team members
- ✅ Cannot delete leads
- ✅ Can see team performance
- ✅ Cannot import leads

### Test as Team Member:
- ✅ Can see only assigned leads
- ✅ Can create leads
- ✅ Cannot assign leads
- ✅ Cannot delete leads
- ✅ Cannot see team performance
- ✅ Cannot import leads

---

## Test 15: Activity Timeline

### Steps:
1. **Open Any Lead**
   - Check activity timeline

2. **Perform Actions**
   - Change status
   - Assign to user
   - Schedule follow-up
   - Add note (if available)

3. **Verify Timeline**
   - Each action should create timeline entry
   - Should show: action, details, timestamp, user

### Expected Results:
- ✅ All actions logged
- ✅ Timeline in reverse chronological order
- ✅ Shows user who performed action
- ✅ Clear descriptions

---

## Common Issues and Solutions

### Issue: "Validation error"
**Solution**: Hard refresh browser (Ctrl+Shift+R)

### Issue: Dashboard shows 0s
**Solution**: 
1. Check server logs for errors
2. Create a test lead
3. Check if API is returning data

### Issue: Follow-up not appearing
**Solution**:
1. Check date is within next 7 days
2. Check assigned to correct user
3. Check status is "pending"

### Issue: Can't see assigned lead
**Solution**:
1. Verify assignment was successful
2. Check user role permissions
3. Logout and login again

### Issue: Stats not updating
**Solution**:
1. Dashboard auto-refreshes on changes
2. Switch tabs and come back
3. Check browser console for errors

---

## Performance Checklist

- ✅ Dashboard loads in < 2 seconds
- ✅ Lead list loads in < 1 second
- ✅ Search is instant
- ✅ Status updates are immediate
- ✅ No console errors
- ✅ Smooth scrolling
- ✅ Responsive on mobile

---

## Final Verification

### Create Complete Lead Workflow:
1. ✅ Create lead as Admin
2. ✅ Assign to team member
3. ✅ Team member sees lead
4. ✅ Team member updates status
5. ✅ Team member schedules follow-up
6. ✅ Follow-up appears in dashboard
7. ✅ Team member completes follow-up
8. ✅ Team member converts lead
9. ✅ Dashboard shows conversion
10. ✅ Team performance updates

If all steps work, your Lead Management system is fully functional! 🎉
