#!/usr/bin/env node

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function searchAllPages() {
  try {
    console.log('🔍 Searching all accessible pages in Notion workspace...\n');
    
    const response = await notion.search({});
    
    console.log(`Found ${response.results.length} total pages/databases:\n`);
    
    response.results.forEach((item, index) => {
      const title = item.properties?.title?.title?.[0]?.text?.content || 
                   item.properties?.Name?.title?.[0]?.text?.content ||
                   item.title?.[0]?.text?.content ||
                   'Untitled';
                   
      const type = item.object;
      
      console.log(`${index + 1}. ${title} (${type}) - ID: ${item.id}`);
      
      // Check if this might be our checklist
      if (title.toLowerCase().includes('checklist') || 
          title.toLowerCase().includes('configuration') ||
          title.toLowerCase().includes('completion')) {
        console.log('   ⭐ This might be the checklist page!');
      }
    });
    
    console.log('\n💡 Look for pages containing "checklist", "configuration", or "completion" in the title');
    
  } catch (error) {
    console.error('❌ Error searching pages:', error.message);
  }
}

searchAllPages();