#!/usr/bin/env node

/**
 * Notion Setup Helper for SkillNavigator
 * Helps automate database creation and configuration
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Database schemas
const DATABASE_SCHEMAS = {
  daily_standups: {
    title: [{ text: { content: 'SkillNavigator Daily Standups' } }],
    properties: {
      'Date': { date: {} },
      'Status': {
        select: {
          options: [
            { name: 'Planned', color: 'blue' },
            { name: 'In Progress', color: 'yellow' },
            { name: 'Completed', color: 'green' },
            { name: 'Blocked', color: 'red' }
          ]
        }
      },
      'Human Focus Time': { number: { format: 'number' } },
      'AI Tasks Assigned': { number: { format: 'number' } },
      'Key Decisions': { rich_text: {} },
      'Tomorrow\'s Priorities': { rich_text: {} },
      'Blockers': { rich_text: {} }
    }
  },

  ai_outputs: {
    title: [{ text: { content: 'AI Agent Outputs' } }],
    properties: {
      'Agent Type': {
        select: {
          options: [
            { name: 'Code Architect', color: 'blue' },
            { name: 'Research Analyst', color: 'green' },
            { name: 'Content Strategist', color: 'purple' },
            { name: 'Business Analyst', color: 'orange' },
            { name: 'Product Manager', color: 'red' }
          ]
        }
      },
      'Created': { date: {} },
      'Status': {
        select: {
          options: [
            { name: 'Generated', color: 'yellow' },
            { name: 'Under Review', color: 'blue' },
            { name: 'Approved', color: 'green' },
            { name: 'Needs Revision', color: 'red' },
            { name: 'Implemented', color: 'purple' }
          ]
        }
      },
      'Quality Score': { number: { format: 'number' } },
      'Review Required': { checkbox: {} },
      'Implementation Time': { number: { format: 'number' } },
      'Tags': {
        multi_select: {
          options: [
            { name: 'Frontend', color: 'blue' },
            { name: 'Backend', color: 'green' },
            { name: 'Database', color: 'red' },
            { name: 'Research', color: 'purple' },
            { name: 'Content', color: 'orange' },
            { name: 'Strategy', color: 'pink' }
          ]
        }
      }
    }
  },

  weekly_reviews: {
    title: [{ text: { content: 'Weekly Reviews' } }],
    properties: {
      'Week': { title: {} },
      'Date Range': { rich_text: {} },
      'Productivity Score': { number: { format: 'number' } },
      'AI Accuracy Rate': { number: { format: 'percent' } },
      'Key Achievements': { rich_text: {} },
      'Optimization Opportunities': { rich_text: {} }
    }
  },

  project_tasks: {
    title: [{ text: { content: 'Project Tasks' } }],
    properties: {
      'Task': { title: {} },
      'Status': {
        select: {
          options: [
            { name: 'Not Started', color: 'gray' },
            { name: 'In Progress', color: 'blue' },
            { name: 'Review', color: 'yellow' },
            { name: 'Done', color: 'green' },
            { name: 'Blocked', color: 'red' }
          ]
        }
      },
      'Assigned To': {
        select: {
          options: [
            { name: 'Human', color: 'green' },
            { name: 'Code Architect', color: 'blue' },
            { name: 'Research Analyst', color: 'purple' },
            { name: 'Content Strategist', color: 'orange' },
            { name: 'Business Analyst', color: 'red' },
            { name: 'Product Manager', color: 'pink' }
          ]
        }
      },
      'Priority': {
        select: {
          options: [
            { name: 'Low', color: 'gray' },
            { name: 'Medium', color: 'blue' },
            { name: 'High', color: 'yellow' },
            { name: 'Critical', color: 'red' }
          ]
        }
      },
      'Due Date': { date: {} },
      'Estimated Hours': { number: { format: 'number' } },
      'Category': {
        multi_select: {
          options: [
            { name: 'Development', color: 'blue' },
            { name: 'Research', color: 'green' },
            { name: 'Content', color: 'purple' },
            { name: 'Business', color: 'orange' },
            { name: 'Strategy', color: 'red' }
          ]
        }
      }
    }
  }
};

async function createDatabase(key, schema) {
  try {
    console.log(`Creating ${key} database...`);
    
    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: process.env.NOTION_WORKSPACE_ID
      },
      ...schema
    });
    
    console.log(`✅ Created ${key} database: ${response.id}`);
    return response.id;
  } catch (error) {
    console.error(`❌ Failed to create ${key} database:`, error.message);
    
    if (error.message.includes('parent')) {
      console.log('💡 Try creating a page first, then use that page ID instead of workspace ID');
    }
    
    return null;
  }
}

async function testConnection() {
  try {
    console.log('Testing Notion connection...');
    
    const response = await notion.users.me();
    console.log(`✅ Connected successfully as: ${response.name || response.id}`);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 Check your NOTION_TOKEN in the .env file');
    }
    
    return false;
  }
}

async function listDatabases() {
  try {
    console.log('Listing existing databases...');
    
    const response = await notion.search({
      filter: { object: 'database' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' }
    });
    
    if (response.results.length === 0) {
      console.log('No databases found in workspace.');
      return;
    }
    
    console.log('Found databases:');
    response.results.forEach(db => {
      console.log(`  - ${db.title[0]?.text?.content || 'Untitled'} (${db.id})`);
    });
    
  } catch (error) {
    console.error('Failed to list databases:', error.message);
  }
}

async function generateConfigUpdate(databaseIds) {
  const configUpdate = `
# Update your 08-automation/configs/notion-integration.yaml with these database IDs:

notion:
  databases:
${Object.entries(databaseIds)
  .map(([key, id]) => `    ${key}: "${id}"`)
  .join('\n')}
`;
  
  console.log(configUpdate);
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testConnection();
      break;
      
    case 'create':
      const connected = await testConnection();
      if (!connected) return;
      
      console.log('\n🚀 Creating databases...\n');
      
      const databaseIds = {};
      for (const [key, schema] of Object.entries(DATABASE_SCHEMAS)) {
        const id = await createDatabase(key, schema);
        if (id) databaseIds[key] = id;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      }
      
      console.log('\n📋 Database Creation Summary:');
      console.log('============================');
      Object.entries(databaseIds).forEach(([key, id]) => {
        console.log(`${key}: ${id}`);
      });
      
      if (Object.keys(databaseIds).length > 0) {
        await generateConfigUpdate(databaseIds);
      }
      break;
      
    case 'list':
      await listDatabases();
      break;
      
    case 'config':
      console.log(`
📖 Setup Instructions:

1. Create a Notion Integration:
   - Go to: https://www.notion.so/my-integrations
   - Click "Create new integration"
   - Name: SkillNavigator AI
   - Select your workspace
   - Copy the integration token

2. Update your .env file:
   NOTION_TOKEN=your_integration_token_here

3. Test the connection:
   node notion-setup-helper.js test

4. Create databases:
   node notion-setup-helper.js create

5. Share databases with integration (for each database created):
   - Click Share button in database
   - Search for "SkillNavigator AI"
   - Click Invite
      `);
      break;
      
    default:
      console.log(`
Usage: node notion-setup-helper.js [command]

Commands:
  test    - Test Notion API connection
  create  - Create all required databases
  list    - List existing databases
  config  - Show setup instructions

Make sure to set NOTION_TOKEN in your .env file first!
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createDatabase, testConnection, listDatabases };