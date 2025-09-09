# Manual Notion Database Setup

Since we can't create databases programmatically without a specific page ID, here's how to create them manually:

## ✅ Integration Connected Successfully
Your Notion integration "SkillNavigator AI" is connected and working!

## 📋 Create These Databases Manually

### 1. Daily Standups Database
**Name**: `SkillNavigator Daily Standups`

**Properties to add**:
- `Date` (Date)
- `Status` (Select) - Options: Planned (Blue), In Progress (Yellow), Completed (Green), Blocked (Red)
- `Human Focus Time` (Number)
- `AI Tasks Assigned` (Number)
- `Key Decisions` (Text)
- `Tomorrow's Priorities` (Text)
- `Blockers` (Text)

### 2. AI Outputs Database
**Name**: `AI Agent Outputs`

**Properties to add**:
- `Agent Type` (Select) - Options: Code Architect (Blue), Research Analyst (Green), Content Strategist (Purple), Business Analyst (Orange), Product Manager (Red)
- `Created` (Date)
- `Status` (Select) - Options: Generated (Yellow), Under Review (Blue), Approved (Green), Needs Revision (Red), Implemented (Purple)
- `Quality Score` (Number)
- `Review Required` (Checkbox)
- `Implementation Time` (Number)
- `Tags` (Multi-select) - Options: Frontend (Blue), Backend (Green), Database (Red), Research (Purple), Content (Orange), Strategy (Pink)

### 3. Weekly Reviews Database
**Name**: `Weekly Reviews`

**Properties to add**:
- `Week` (Title)
- `Date Range` (Text)
- `Productivity Score` (Number)
- `AI Accuracy Rate` (Number - format as Percent)
- `Key Achievements` (Text)
- `Optimization Opportunities` (Text)

### 4. Project Tasks Database
**Name**: `Project Tasks`

**Properties to add**:
- `Task` (Title)
- `Status` (Select) - Options: Not Started (Gray), In Progress (Blue), Review (Yellow), Done (Green), Blocked (Red)
- `Assigned To` (Select) - Options: Human (Green), Code Architect (Blue), Research Analyst (Purple), Content Strategist (Orange), Business Analyst (Red), Product Manager (Pink)
- `Priority` (Select) - Options: Low (Gray), Medium (Blue), High (Yellow), Critical (Red)
- `Due Date` (Date)
- `Estimated Hours` (Number)
- `Category` (Multi-select) - Options: Development (Blue), Research (Green), Content (Purple), Business (Orange), Strategy (Red)

## 🔗 Share Databases with Integration

**For each database you create**:
1. Click the "Share" button (top right of database)
2. Search for "SkillNavigator AI"
3. Click "Invite"
4. Copy the database URL to get the database ID

## 📝 Update Configuration

Once you've created the databases and shared them, copy each database ID from the URL:
```
https://www.notion.so/your-workspace/DATABASE_NAME-{DATABASE_ID}?v=...
```

Then update `08-automation/configs/notion-integration.yaml`:
```yaml
notion:
  databases:
    daily_standups: "your-daily-standup-database-id"
    ai_outputs: "your-ai-outputs-database-id"
    weekly_reviews: "your-weekly-reviews-database-id"
    project_tasks: "your-project-tasks-database-id"
```

## 🧪 Test the Setup

After updating the configuration, test it:
```bash
node 08-automation/scripts/notion-sync.js daily "Testing manual setup"
```

## Quick Database Creation Tips:
1. In Notion, type `/database` and select "Table - Inline"
2. Name your database
3. Add properties by clicking the "+" next to existing columns
4. Set the property types as specified above
5. Don't forget to share each database with "SkillNavigator AI"