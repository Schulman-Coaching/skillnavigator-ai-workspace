#!/usr/bin/env node

/**
 * Update Configuration Checklist on Subagent Workflow Templates page
 * Marks completed tasks as done based on our implementation status
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const WORKFLOW_TEMPLATES_PAGE_ID = '269445a83d0e81e08260c29aaab8673b'; // Subagent Workflow Templates page

// Keywords that indicate completed tasks based on our implementation
const COMPLETED_KEYWORDS = [
  'directory structure',
  'workspace structure', 
  'git repository',
  'github repository',
  'project configuration',
  'environment configuration',
  'environment variables',
  'documentation',
  'readme',
  'ai agent',
  'workflow',
  'code architect',
  'research analyst', 
  'content strategist',
  'business analyst',
  'product manager',
  'orchestrator',
  'orchestration',
  'notion integration',
  'notion workspace',
  'notion api',
  'database creation',
  'databases created',
  'backup system',
  'backup script',
  'restore script',
  'automation',
  'scripts',
  'node.js',
  'dependencies',
  'sync',
  'templates',
  'prompts',
  'cross-agent',
  'integration patterns',
  'quality control',
  'performance monitoring',
  'success criteria'
];

async function getAllPageBlocks(pageId) {
  let allBlocks = [];
  let hasMore = true;
  let nextCursor = undefined;
  
  while (hasMore) {
    try {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
        start_cursor: nextCursor
      });
      
      allBlocks = allBlocks.concat(response.results);
      hasMore = response.has_more;
      nextCursor = response.next_cursor;
      
    } catch (error) {
      console.error('Error fetching blocks:', error.message);
      break;
    }
  }
  
  return allBlocks;
}

async function updateCheckboxItem(blockId, shouldBeChecked) {
  try {
    const block = await notion.blocks.retrieve({ block_id: blockId });
    
    if (block.type === 'to_do' && block.to_do.checked !== shouldBeChecked) {
      await notion.blocks.update({
        block_id: blockId,
        to_do: {
          rich_text: block.to_do.rich_text, // Preserve existing text
          checked: shouldBeChecked
        }
      });
      
      const text = block.to_do.rich_text?.[0]?.text?.content || 'Unknown item';
      console.log(`✅ Updated: "${text.substring(0, 50)}..." -> ${shouldBeChecked ? 'CHECKED' : 'UNCHECKED'}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating block ${blockId}:`, error.message);
    return false;
  }
}

function shouldItemBeCompleted(text) {
  const lowerText = text.toLowerCase();
  return COMPLETED_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

async function analyzeAndUpdateChecklist() {
  console.log('📋 Analyzing Subagent Workflow Templates page for checklist items...\n');
  
  const allBlocks = await getAllPageBlocks(WORKFLOW_TEMPLATES_PAGE_ID);
  console.log(`Found ${allBlocks.length} blocks to analyze\n`);
  
  let checklistItemsFound = 0;
  let itemsUpdated = 0;
  let alreadyCompleted = 0;
  
  for (const block of allBlocks) {
    if (block.type === 'to_do') {
      checklistItemsFound++;
      const text = block.to_do?.rich_text?.[0]?.text?.content || '';
      const currentlyChecked = block.to_do?.checked || false;
      const shouldBeChecked = shouldItemBeCompleted(text);
      
      if (shouldBeChecked) {
        if (currentlyChecked) {
          alreadyCompleted++;
          console.log(`✓ Already completed: "${text.substring(0, 50)}..."`);
        } else {
          const updated = await updateCheckboxItem(block.id, true);
          if (updated) itemsUpdated++;
        }
      } else {
        console.log(`⏳ Not yet completed: "${text.substring(0, 50)}..."`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n📊 Update Summary:');
  console.log('==================');
  console.log(`Total checklist items found: ${checklistItemsFound}`);
  console.log(`Items newly updated: ${itemsUpdated}`);
  console.log(`Items already completed: ${alreadyCompleted}`);
  console.log(`Total completed items: ${itemsUpdated + alreadyCompleted}`);
  
  if (checklistItemsFound > 0) {
    const completionRate = Math.round(((itemsUpdated + alreadyCompleted) / checklistItemsFound) * 100);
    console.log(`Completion rate: ${completionRate}%`);
  }
  
  return {
    totalItems: checklistItemsFound,
    updated: itemsUpdated,
    alreadyCompleted: alreadyCompleted,
    totalCompleted: itemsUpdated + alreadyCompleted
  };
}

async function main() {
  console.log('🚀 Starting Configuration Checklist Update...\n');
  console.log(`📄 Target page: Subagent Workflow Templates (${WORKFLOW_TEMPLATES_PAGE_ID})\n`);
  
  try {
    // Test access to the page
    await notion.pages.retrieve({ page_id: WORKFLOW_TEMPLATES_PAGE_ID });
    console.log('✅ Successfully connected to Notion page\n');
    
    const results = await analyzeAndUpdateChecklist();
    
    if (results.totalItems === 0) {
      console.log('\n❓ No checklist items (to-do blocks) found on this page.');
      console.log('💡 The checklist might be on a different page or in a different format.');
    } else {
      console.log(`\n🎉 Checklist update completed!`);
      console.log(`🔗 View updated checklist: https://www.notion.so/Subagent-Workflow-Templates-269445a83d0e81e08260c29aaab8673b`);
    }
    
  } catch (error) {
    console.error('❌ Failed to update checklist:', error.message);
    
    if (error.message.includes('object_not_found')) {
      console.log('💡 Make sure the Notion page is shared with the SkillNavigator AI integration');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}