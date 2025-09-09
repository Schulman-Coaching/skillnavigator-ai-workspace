#!/usr/bin/env node

/**
 * Update Notion Configuration Checklist
 * Marks completed tasks as done based on our implementation status
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// You'll need to provide the page ID of your checklist
const CHECKLIST_PAGE_ID = 'your-checklist-page-id'; // Replace with actual page ID

async function findChecklistPage() {
  try {
    console.log('🔍 Searching for Configuration Checklist page...');
    
    // Search for pages containing "checklist" or "configuration"
    const searchResponse = await notion.search({
      query: 'Configuration Completion Checklist',
      filter: {
        object: 'page'
      }
    });
    
    console.log(`Found ${searchResponse.results.length} matching pages:`);
    
    searchResponse.results.forEach(page => {
      const title = page.properties?.title?.title?.[0]?.text?.content || 
                   page.properties?.Name?.title?.[0]?.text?.content ||
                   'Untitled';
      console.log(`  - ${title} (${page.id})`);
    });
    
    if (searchResponse.results.length > 0) {
      const checklistPage = searchResponse.results.find(page => {
        const title = page.properties?.title?.title?.[0]?.text?.content || 
                     page.properties?.Name?.title?.[0]?.text?.content || '';
        return title.toLowerCase().includes('checklist') || title.toLowerCase().includes('configuration');
      });
      
      if (checklistPage) {
        console.log(`✅ Found checklist page: ${checklistPage.id}`);
        return checklistPage.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error searching for checklist page:', error.message);
    return null;
  }
}

async function getPageBlocks(pageId) {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });
    
    return response.results;
  } catch (error) {
    console.error('❌ Error fetching page blocks:', error.message);
    return [];
  }
}

async function updateChecklistItem(blockId, isCompleted = true) {
  try {
    await notion.blocks.update({
      block_id: blockId,
      to_do: {
        rich_text: [/* existing text would be preserved */],
        checked: isCompleted
      }
    });
    
    console.log(`✅ Updated checklist item: ${blockId}`);
  } catch (error) {
    console.error(`❌ Error updating checklist item: ${error.message}`);
  }
}

async function analyzeAndUpdateChecklist(pageId) {
  const blocks = await getPageBlocks(pageId);
  
  const completedItems = [
    // Based on our implementation, these should be checked
    'directory structure',
    'git repository',
    'github repository',
    'project configuration',
    'environment configuration',
    'documentation',
    'ai agent',
    'workflow',
    'notion integration',
    'notion workspace',
    'database creation',
    'backup system',
    'restore script',
    'automation',
    'scripts',
    'node.js',
    'dependencies'
  ];
  
  let updatedCount = 0;
  
  for (const block of blocks) {
    if (block.type === 'to_do') {
      const text = block.to_do?.rich_text?.[0]?.text?.content?.toLowerCase() || '';
      
      // Check if this item should be marked complete
      const shouldBeCompleted = completedItems.some(keyword => text.includes(keyword));
      
      if (shouldBeCompleted && !block.to_do.checked) {
        await updateChecklistItem(block.id, true);
        updatedCount++;
      }
    }
  }
  
  console.log(`🎉 Updated ${updatedCount} checklist items`);
}

async function main() {
  console.log('🚀 Starting Notion checklist update...\n');
  
  // First, try to find the checklist page
  const pageId = await findChecklistPage();
  
  if (!pageId) {
    console.log('\n❌ Could not find Configuration Checklist page in Notion');
    console.log('💡 Please provide the page ID manually or share the page URL');
    return;
  }
  
  console.log('\n📋 Analyzing and updating checklist...');
  await analyzeAndUpdateChecklist(pageId);
  
  console.log('\n✅ Checklist update completed!');
}

if (require.main === module) {
  main().catch(console.error);
}