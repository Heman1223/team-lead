# Search Input Fix Pattern

## Problem:
Search icon overlapping with placeholder text on mobile devices.

## Solution:
Apply responsive padding and sizing to all search inputs.

## Pattern to Apply:

```jsx
{/* Search Input - CORRECT PATTERN */}
<div className="relative flex-1">
    <Search className="absolute left-2.5 sm:left-3 lg:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none" />
    <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 sm:pl-10 lg:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    />
</div>
```

## Key Changes:

### Icon:
- Position: `left-2.5 sm:left-3 lg:left-4` (responsive)
- Size: `w-4 h-4 sm:w-5 sm:h-5` (smaller on mobile)
- Add: `pointer-events-none` (prevents click interference)

### Input:
- Left padding: `pl-9 sm:pl-10 lg:pl-12` (matches icon position + space)
- Right padding: `pr-3 sm:pr-4` (responsive)
- Vertical padding: `py-2 sm:py-2.5 lg:py-3` (responsive)
- Text size: `text-sm sm:text-base` (readable on mobile)
- Border radius: `rounded-lg sm:rounded-xl` (responsive)

## Calculation:
- Mobile: Icon at left-2.5 (10px) + icon width 16px + gap 8px = pl-9 (36px)
- Tablet: Icon at left-3 (12px) + icon width 20px + gap 8px = pl-10 (40px)
- Desktop: Icon at left-4 (16px) + icon width 20px + gap 12px = pl-12 (48px)

## Files Fixed:
✅ client/src/pages/leads/LeadListSimple.jsx
✅ client/src/pages/TeamManagement.jsx

## Files to Fix:
- [ ] client/src/pages/Notifications.jsx
- [ ] client/src/pages/leads/LeadList.jsx
- [ ] client/src/pages/Communication.jsx
- [ ] client/src/pages/AdminUserManagement.jsx
- [ ] client/src/pages/AdminTeamManagement.jsx
- [ ] client/src/pages/AdminTaskManagement.jsx
- [ ] client/src/pages/AdminTaskAssignment.jsx
- [ ] client/src/pages/AdminActivityLogs.jsx

## Mobile Placeholder Text:
For very long placeholders on mobile, shorten them:
- Desktop: "Search members by name, email, or designation..."
- Mobile: "Search members..."

Use responsive placeholders if needed or keep short universal text.
