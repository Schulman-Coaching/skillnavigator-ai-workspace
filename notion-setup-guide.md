# Notion Integration Setup Guide

## Step 1: Get Your Notion Workspace ID

1. **Open your Notion workspace**
2. **Copy the workspace ID** from the URL:
   ```
   https://www.notion.so/your-workspace-name-{WORKSPACE_ID}
   ```
   The workspace ID is the string after your workspace name

## Step 2: Create Notion Integration

1. **Go to Notion Integrations**: https://www.notion.so/my-integrations
2. **Click "Create new integration"**
3. **Fill out the form**:
   - Name: `SkillNavigator AI`
   - Associated workspace: Select your workspace
   - Capabilities: Read, Update, Insert content
4. **Copy the Internal Integration Token**

## Step 3: Create Required Databases

Create these databases in your Notion workspace:

### Daily Standups Database
- **Name**: "SkillNavigator Daily Standups"
- **Properties**:
  - Date (Date)
  - Status (Select: Planned, In Progress, Completed, Blocked)
  - Human Focus Time (Number)
  - AI Tasks Assigned (Number)
  - Key Decisions (Text)
  - Tomorrow's Priorities (Text)
  - Blockers (Text)

### AI Outputs Database
- **Name**: "AI Agent Outputs"
- **Properties**:
  - Agent Type (Select: Code Architect, Research Analyst, Content Strategist, Business Analyst, Product Manager)
  - Created (Date)
  - Status (Select: Generated, Under Review, Approved, Needs Revision, Implemented)
  - Quality Score (Number)
  - Review Required (Checkbox)
  - Implementation Time (Number)
  - Tags (Multi-select: Frontend, Backend, Database, Research, Content, Strategy)

### Weekly Reviews Database
- **Name**: "Weekly Reviews"
- **Properties**:
  - Week (Title)
  - Date Range (Text)
  - Productivity Score (Number)
  - AI Accuracy Rate (Number)

## Step 4: Share Databases with Integration

For each database created:
1. **Click the "Share" button** in the top right
2. **Search for "SkillNavigator AI"** (your integration name)
3. **Select it and click "Invite"**

## Step 5: Update Configuration Files

1. **Copy database IDs** from each database URL:
   ```
   https://notion.so/your-workspace/{DATABASE_ID}?v=...
   ```

2. **Update `project-config.yaml`**:
   ```yaml
   integrations:
     notion_workspace_id: "your-actual-workspace-id"
   ```

3. **Update `08-automation/configs/notion-integration.yaml`**:
   ```yaml
   notion:
     workspace_id: "your-actual-workspace-id"
     databases:
       daily_standups: "your-daily-standup-database-id"
       ai_outputs: "your-ai-outputs-database-id"
       weekly_reviews: "your-weekly-review-database-id"
   ```

4. **Update your `.env` file**:
   ```env
   NOTION_TOKEN=your_integration_token_here
   NOTION_WORKSPACE_ID=your_workspace_id_here
   ```

## Step 6: Install Dependencies

```bash
cd ~/skillnavigator-ai-workspace
npm init -y
npm install @notionhq/client js-yaml
```

## Step 7: Test the Integration

```bash
# Test the connection
node 08-automation/scripts/notion-sync.js daily "Testing integration"

# Start the auto-sync watcher
./08-automation/scripts/auto-sync-rules.sh watch
```

## Usage Examples

### Manual Syncing
```bash
# Sync daily standup
./08-automation/scripts/auto-sync-rules.sh daily "Completed all tasks"

# Sync weekly review  
./08-automation/scripts/auto-sync-rules.sh weekly 1 "Sept 9-15" "Great progress this week"

# Test AI output sync
./08-automation/scripts/auto-sync-rules.sh test
```

### Automated Syncing
The watcher will automatically sync any new files created in `04-ai-agents/outputs/` to Notion.

## Troubleshooting

- **403 Errors**: Make sure you've shared the databases with your integration
- **Database not found**: Double-check the database IDs in your config
- **Token issues**: Verify your integration token in the `.env` file
- **File watching not working**: Install `fswatch` with `brew install fswatch`