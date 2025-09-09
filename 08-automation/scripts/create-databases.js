#!/usr/bin/env node

/**
 * Create Notion databases using the main page as parent
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Use the page ID from your URL
const PARENT_PAGE_ID = '268445a83d0e81d0895decd6ceed7af5';

// Database schemas
const DATABASE_SCHEMAS = {
  daily_standups: {
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ text: { content: 'SkillNavigator Daily Standups' } }],
    properties: {
      'Name': { title: {} }, // Required title property
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
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
    title: [{ text: { content: 'AI Agent Outputs' } }],
    properties: {
      'Name': { title: {} }, // Required title property
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
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
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
    parent: { type: 'page_id', page_id: PARENT_PAGE_ID },
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
    
    const response = await notion.databases.create(schema);
    
    console.log(`✅ Created ${key} database: ${response.id}`);
    console.log(`   URL: https://www.notion.so/${response.id.replace(/-/g, '')}`);
    return response.id;
  } catch (error) {
    console.error(`❌ Failed to create ${key} database:`, error.message);
    
    if (error.message.includes('object_not_found')) {
      console.log('💡 Make sure the page exists and is shared with the integration');
    }
    
    return null;
  }
}

async function testPageAccess() {
  try {
    console.log('Testing access to parent page...');
    
    const response = await notion.pages.retrieve({ page_id: PARENT_PAGE_ID });
    console.log(`✅ Can access page: ${response.properties?.title?.title?.[0]?.text?.content || 'Page found'}`);
    return true;
  } catch (error) {
    console.error('❌ Cannot access parent page:', error.message);
    
    if (error.message.includes('object_not_found')) {
      console.log('💡 You need to share the main page with the "SkillNavigator AI" integration first');
      console.log('   1. Go to: https://www.notion.so/SkillNavigator-Learning-Platform-Workspace-268445a83d0e81d0895decd6ceed7af5');
      console.log('   2. Click "Share" button');
      console.log('   3. Search for "SkillNavigator AI"');
      console.log('   4. Click "Invite"');
    }
    
    return false;
  }
}

async function main() {
  console.log('🚀 Creating Notion databases...\n');
  
  // First test if we can access the parent page
  const canAccess = await testPageAccess();
  if (!canAccess) {
    return;
  }
  
  console.log('\n📋 Creating databases...\n');
  
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
    console.log(`\n📝 Update your 08-automation/configs/notion-integration.yaml:`);
    console.log('databases:');
    Object.entries(databaseIds).forEach(([key, id]) => {
      console.log(`  ${key}: "${id}"`);
    });
  }
}

if (require.main === module) {
  main().catch(console.error);
}