#!/usr/bin/env node

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function checkDatabaseProperties() {
  const databaseIds = {
    daily_standups: "4880ac73-8a85-4d30-8b9b-71936ab6dd62",
    ai_outputs: "3fdd6c0d-febb-4103-bd29-c2ba11ea818c",
    weekly_reviews: "3f72b418-500d-425c-85f4-309afe9f46dd",
    project_tasks: "1ec0066a-3f72-4a65-a611-9c7497e9cb81"
  };

  for (const [name, id] of Object.entries(databaseIds)) {
    try {
      console.log(`\n🗄️  ${name} (${id}):`);
      const database = await notion.databases.retrieve({ database_id: id });
      
      console.log('Properties:');
      if (database.properties) {
        Object.entries(database.properties).forEach(([propName, propConfig]) => {
          console.log(`  - ${propName} (${propConfig.type})`);
        });
      } else {
        console.log('  No properties found');
      }
      
    } catch (error) {
      console.error(`❌ Failed to retrieve ${name}:`, error.message);
    }
  }
}

checkDatabaseProperties();