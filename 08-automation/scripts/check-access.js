#!/usr/bin/env node

const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

async function checkAccess() {
  try {
    console.log('🔍 Checking what the integration can access...\n');
    
    // Search for all content
    const response = await notion.search({});
    
    const pages = response.results.filter(item => item.object === 'page');
    const databases = response.results.filter(item => item.object === 'database');
    
    console.log(`📄 Accessible Pages (${pages.length}):`);
    pages.forEach(page => {
      const title = page.properties?.title?.title?.[0]?.text?.content || 
                   page.properties?.Name?.title?.[0]?.text?.content ||
                   'Untitled';
      console.log(`  - ${title} (${page.id})`);
    });
    
    console.log(`\n🗄️  Accessible Databases (${databases.length}):`);
    databases.forEach(db => {
      const title = db.title?.[0]?.text?.content || 'Untitled Database';
      console.log(`  - ${title} (${db.id})`);
    });
    
    if (pages.length === 0 && databases.length === 0) {
      console.log('\n❌ No accessible content found.');
      console.log('\n💡 To fix this:');
      console.log('1. Go to your Notion page');
      console.log('2. Click "Share" button');
      console.log('3. Search for "SkillNavigator AI"');
      console.log('4. Click "Invite"');
    } else if (pages.length > 0) {
      console.log('\n✅ Found accessible pages! You can use any of these as a parent for creating databases.');
    }
    
  } catch (error) {
    console.error('❌ Error checking access:', error.message);
  }
}

checkAccess();