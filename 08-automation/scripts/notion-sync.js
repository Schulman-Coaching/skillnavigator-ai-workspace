#!/usr/bin/env node

/**
 * Notion Integration Script for SkillNavigator
 * Syncs AI outputs and project data with Notion workspace
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

class NotionSync {
  constructor() {
    this.notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });
    this.config = null;
  }

  async init() {
    try {
      const configPath = path.join(__dirname, '../configs/notion-integration.yaml');
      const configFile = await fs.readFile(configPath, 'utf8');
      this.config = yaml.load(configFile);
    } catch (error) {
      console.error('Failed to load Notion config:', error.message);
      process.exit(1);
    }
  }

  async createDailyStandup(data) {
    const { databases } = this.config.notion;
    
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: databases.daily_standups },
        properties: {
          'Name': {
            title: [{ text: { content: `Daily Standup - ${data.date}` } }]
          },
          'Date': {
            date: { start: data.date }
          },
          'Status': {
            select: { name: data.status || 'In Progress' }
          },
          'Human Focus Time': {
            number: data.humanFocusTime || null
          },
          'AI Tasks Assigned': {
            number: data.aiTasksAssigned || null
          },
          'Key Decisions': {
            rich_text: [{ text: { content: data.keyDecisions || '' } }]
          },
          'Tomorrow\'s Priorities': {
            rich_text: [{ text: { content: data.tomorrowPriorities || '' } }]
          },
          'Blockers': {
            rich_text: [{ text: { content: data.blockers || '' } }]
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ text: { content: 'Daily Standup Summary' } }]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: data.summary || 'No summary provided.' } }]
            }
          }
        ]
      });
      
      console.log(`✅ Created daily standup page: ${response.id}`);
      return response;
    } catch (error) {
      console.error('Failed to create daily standup:', error.message);
    }
  }

  async createAIOutput(agentType, output, metadata = {}) {
    const { databases } = this.config.notion;
    
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: databases.ai_outputs },
        properties: {
          'Name': {
            title: [{ text: { content: `${agentType} - ${new Date().toISOString().split('T')[0]}` } }]
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ text: { content: `${agentType} Output` } }]
            }
          },
          {
            object: 'block',
            type: 'code',
            code: {
              language: metadata.language || 'plain text',
              rich_text: [{ text: { content: output } }]
            }
          }
        ]
      });
      
      console.log(`✅ Created AI output page for ${agentType}: ${response.id}`);
      return response;
    } catch (error) {
      console.error(`Failed to create AI output for ${agentType}:`, error.message);
    }
  }

  async syncWeeklyReview(reviewData) {
    const { databases } = this.config.notion;
    
    try {
      const response = await this.notion.pages.create({
        parent: { database_id: databases.weekly_reviews },
        properties: {
          'Week': {
            title: [{ text: { content: `Week ${reviewData.weekNumber}` } }]
          },
          'Date Range': {
            rich_text: [{ text: { content: reviewData.dateRange } }]
          },
          'Productivity Score': {
            number: reviewData.productivityScore || null
          },
          'AI Accuracy Rate': {
            number: reviewData.accuracyRate || null
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ text: { content: 'Weekly Summary' } }]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: reviewData.summary } }]
            }
          }
        ]
      });
      
      console.log(`✅ Created weekly review: ${response.id}`);
      return response;
    } catch (error) {
      console.error('Failed to create weekly review:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const sync = new NotionSync();
  await sync.init();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'daily':
      const dailyData = {
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        summary: process.argv[3] || 'Daily standup completed'
      };
      await sync.createDailyStandup(dailyData);
      break;
      
    case 'ai-output':
      const agentType = process.argv[3];
      const output = process.argv[4];
      await sync.createAIOutput(agentType, output);
      break;
      
    case 'weekly':
      const weekData = {
        weekNumber: process.argv[3] || 1,
        dateRange: process.argv[4] || 'Current Week',
        summary: process.argv[5] || 'Weekly review completed'
      };
      await sync.syncWeeklyReview(weekData);
      break;
      
    default:
      console.log('Usage: node notion-sync.js [daily|ai-output|weekly] [args...]');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NotionSync;