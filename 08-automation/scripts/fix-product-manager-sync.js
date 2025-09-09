#!/usr/bin/env node

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const PARENT_PAGE_ID = '269445a83d0e81e08260c29aaab8673b';

async function createProductManagerWorkflow() {
  try {
    console.log('Creating Product Manager Workflow with text length handling...');
    
    const response = await notion.pages.create({
      parent: {
        type: 'page_id',
        page_id: PARENT_PAGE_ID
      },
      properties: {
        title: {
          title: [{ text: { content: '🗺️ Product Manager Workflow' } }]
        }
      },
      icon: {
        type: 'emoji',
        emoji: '🗺️'
      },
      children: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: 'Product Manager - AI Subagent Workflow' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ 
              type: 'text', 
              text: { 
                content: 'Lead product strategy, roadmap planning, and feature development for SkillNavigator using agile methodologies and data-driven decision making to deliver exceptional user experiences.' 
              } 
            }]
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '🏗️ Product Management Specializations' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Product Strategy: Vision development, market positioning, competitive differentiation' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Roadmap Planning: Feature prioritization, release planning, stakeholder alignment' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'User Experience: User journey optimization, usability testing, accessibility compliance' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Agile Management: Sprint planning, backlog management, velocity optimization' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Stakeholder Communication: Executive reporting, team coordination, user advocacy' } }]
          }
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Data-Driven Decisions: Metrics analysis, A/B testing, user research integration' } }]
          }
        },
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [{ 
              type: 'text', 
              text: { 
                content: 'Complete workflow details available in GitHub repository and local workspace files. This Notion page contains the essential framework and can be expanded with specific prompts and procedures as needed.' 
              } 
            }],
            icon: { emoji: '📋' },
            color: 'blue_background'
          }
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ type: 'text', text: { content: '📋 Daily Workflow Structure' } }]
          }
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Morning Strategic Review (45 minutes): Review user feedback, analyze metrics, check development progress' } }]
          }
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Product Strategy Development: Define vision, market positioning, value propositions' } }]
          }
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Roadmap Planning: Prioritize features, plan releases, align stakeholders' } }]
          }
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Requirements Creation: Write user stories, define acceptance criteria, specify technical requirements' } }]
          }
        },
        {
          object: 'block',
          type: 'numbered_list_item',
          numbered_list_item: {
            rich_text: [{ type: 'text', text: { content: 'Analytics & Testing: Design A/B tests, analyze performance, optimize user journeys' } }]
          }
        }
      ]
    });

    console.log(`✅ Created Product Manager Workflow: ${response.id}`);
    console.log(`🔗 View at: https://www.notion.so/${response.id.replace(/-/g, '')}`);
    
  } catch (error) {
    console.error('❌ Failed to create Product Manager workflow:', error.message);
  }
}

createProductManagerWorkflow();