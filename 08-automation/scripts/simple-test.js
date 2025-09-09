#!/usr/bin/env node

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function simpleTest() {
  const databaseId = "4880ac73-8a85-4d30-8b9b-71936ab6dd62"; // daily_standups
  
  try {
    console.log('Testing simple page creation...');
    
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': {
          title: [{ text: { content: 'Test Entry - Integration Working!' } }]
        }
      }
    });
    
    console.log(`✅ Successfully created test page: ${response.id}`);
    console.log(`   URL: https://www.notion.so/${response.id.replace(/-/g, '')}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Let me try to get database info...');
    
    try {
      const db = await notion.databases.retrieve({ database_id: databaseId });
      console.log('Database title:', db.title?.[0]?.text?.content || 'No title');
      console.log('Available properties:', Object.keys(db.properties || {}));
    } catch (dbError) {
      console.error('Cannot access database:', dbError.message);
    }
  }
}

simpleTest();