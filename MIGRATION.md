# Database Migration: Add Mission Relationship (Optional)

## Overview
This migration adds a `mission_id` column to the `members` table to establish a relationship between members and missions/branches. This is an **optional** migration - the application works without it.

## When to Run This Migration
Run this migration when you want to enable the following features:
- Show branch/mission locations instead of member residences in reports
- Track which mission/branch each member belongs to
- Enable the "Cities Reached" card to show unique mission locations
- Enable the "Top Cities" graph to display branch locations

## SQL Migration
Run the following SQL in your database:

```sql
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS mission_id uuid REFERENCES missions(id) ON DELETE SET NULL;
```

## What This Does
- Adds a `mission_id` column to the `members` table
- Creates a foreign key relationship with the `missions` table
- Sets the column to NULL if a mission is deleted (ON DELETE SET NULL)
- Uses IF NOT EXISTS to make the migration safe to run multiple times

## Impact on Reports
After this migration:
- The "Cities Reached" card will show unique mission locations instead of member residences
- The "Top Cities" graph will display branch locations from the missions table
- The reports table will show mission location in the "City/Branch" column
- If a member has no mission assigned, it will fall back to their residence city

## Post-Migration Code Changes
After running this migration, you'll need to update the code to enable the mission features:

1. **Update schema**: Add `mission_id` field back to `db/schema.ts` in the members table
2. **Update reports query**: Add the missions table join back to `app/(dashboard)/reports/page.tsx`
3. **Update type**: Add `mission_location` back to the `ReportMember` type
4. **Update column header**: Change column header from "City" to "City/Branch" in `app/(dashboard)/reports/columns.tsx`

## Verification
After running the migration, you can verify it worked by checking:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'members' AND column_name = 'mission_id';
```
