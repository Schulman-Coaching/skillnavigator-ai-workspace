#!/usr/bin/env node

/**
 * Sync AI Agent Workflows to Notion
 * Creates pages in Notion workspace for each workflow template
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PARENT_PAGE_ID = '269445a83d0e81e08260c29aaab8673b'; // Subagent Workflow Templates page

const WORKFLOW_FILES = [
  {
    file: '04-ai-agents/workflows/README.md',
    title: '🤖 AI Agent Workflow Overview',
    emoji: '🤖'
  },
  {
    file: '04-ai-agents/workflows/workflow-orchestrator.md',
    title: '🔄 Workflow Orchestrator',
    emoji: '🔄'
  },
  {
    file: '04-ai-agents/workflows/code-architect-workflow.md',
    title: '💻 Code Architect Workflow',
    emoji: '💻'
  },
  {
    file: '04-ai-agents/workflows/research-analyst-workflow.md',
    title: '🔍 Research Analyst Workflow',
    emoji: '🔍'
  },
  {
    file: '04-ai-agents/workflows/content-strategist-workflow.md',
    title: '✍️ Content Strategist Workflow',
    emoji: '✍️'
  },
  {
    file: '04-ai-agents/workflows/business-analyst-workflow.md',
    title: '📈 Business Analyst Workflow',
    emoji: '📈'
  },
  {
    file: '04-ai-agents/workflows/product-manager-workflow.md',
    title: '🗺️ Product Manager Workflow',
    emoji: '🗺️'
  }
];

async function readMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function parseMarkdownToBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let currentBlock = null;
  let codeBlockContent = [];
  let inCodeBlock = false;
  let codeLanguage = 'plain text';

  for (let line of lines) {
    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (codeBlockContent.length > 0) {
          blocks.push({
            object: 'block',
            type: 'code',
            code: {
              language: codeLanguage,
              rich_text: [{
                type: 'text',
                text: { content: codeBlockContent.join('\n') }
              }]
            }
          });
        }
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        codeLanguage = line.slice(3).trim() || 'plain text';
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headings
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3) } }]
        }
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4) } }]
        }
      });
    }
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
        }
      });
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(line)) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: line.replace(/^\d+\.\s/, '') } }]
        }
      });
    }
    // Handle paragraphs
    else if (line.trim() && !line.startsWith('---')) {
      // Skip horizontal rules and empty lines
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      });
    }
  }

  return blocks;
}

async function createNotionPage(workflow) {
  try {
    console.log(`Creating Notion page: ${workflow.title}`);
    
    const markdown = await readMarkdownFile(workflow.file);
    if (!markdown) {
      console.error(`Failed to read ${workflow.file}`);
      return null;
    }

    const blocks = parseMarkdownToBlocks(markdown);
    
    // Limit blocks to avoid API limits (100 blocks per request)
    const blocksToCreate = blocks.slice(0, 90);
    
    const response = await notion.pages.create({
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID
      },
      properties: {
        title: {
          title: [{ text: { content: workflow.title } }]
        }
      },
      icon: {
        type: 'emoji',
        emoji: workflow.emoji
      },
      children: blocksToCreate
    });

    console.log(`✅ Created: ${workflow.title} (${response.id})`);
    
    // If we had to truncate blocks, add remaining ones
    if (blocks.length > 90) {
      console.log(`📄 Adding remaining ${blocks.length - 90} blocks...`);
      const remainingBlocks = blocks.slice(90);
      
      // Add in batches of 100
      for (let i = 0; i < remainingBlocks.length; i += 100) {
        const batch = remainingBlocks.slice(i, i + 100);
        await notion.blocks.children.append({
          block_id: response.id,
          children: batch
        });
      }
    }
    
    return response;
  } catch (error) {
    console.error(`❌ Failed to create ${workflow.title}:`, error.message);
    return null;
  }
}

async function syncAllWorkflows() {
  console.log('🚀 Syncing AI Agent Workflows to Notion...\n');
  
  // Test connection first
  try {
    await notion.pages.retrieve({ page_id: PARENT_PAGE_ID });
    console.log('✅ Connected to Notion workspace\n');
  } catch (error) {
    console.error('❌ Cannot access Notion page. Check permissions and page ID.');
    return;
  }

  const results = [];
  
  for (const workflow of WORKFLOW_FILES) {
    const result = await createNotionPage(workflow);
    if (result) {
      results.push({
        title: workflow.title,
        url: `https://www.notion.so/${result.id.replace(/-/g, '')}`
      });
    }
    
    // Rate limiting - wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 Sync Summary:');
  console.log('================');
  results.forEach(result => {
    console.log(`✅ ${result.title}`);
    console.log(`   ${result.url}`);
  });
  
  if (results.length > 0) {
    console.log(`\n🎉 Successfully synced ${results.length} workflow templates to Notion!`);
    console.log(`\n🔗 View all workflows at: https://www.notion.so/Subagent-Workflow-Templates-${PARENT_PAGE_ID}`);
  }
}

// CLI interface
if (require.main === module) {
  syncAllWorkflows().catch(console.error);
}

module.exports = { syncAllWorkflows, createNotionPage };