/**
 * Push DB Schema
 * 
 * This script pushes the Drizzle schema to the database.
 * It's used to initialize or update the database schema.
 */

import { db } from '../server/db';
import { stocks, stockData, sectors, marketData, stockNews } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Connecting to database...');
    
    // Create tables if they don't exist
    console.log('Creating stock tables if they don\'t exist...');
    
    // Create stocks table based on the stock_data_integration_guide.md
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${stocks} (
        ticker VARCHAR(10) PRIMARY KEY,
        company_name TEXT NOT NULL,
        sector TEXT,
        industry TEXT,
        country TEXT,
        exchange TEXT,
        currency TEXT,
        market_cap NUMERIC,
        current_price NUMERIC,
        target_price NUMERIC,
        price_to_earnings NUMERIC,
        dividend_yield NUMERIC,
        beta NUMERIC,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created stocks table');
    
    // Create stock_data table based on the stock_data_integration_guide.md
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${stockData} (
        ticker VARCHAR(10) PRIMARY KEY REFERENCES ${stocks}(ticker),
        closing_history JSONB,
        dividends JSONB,
        institutional_holders JSONB,
        major_holders JSONB,
        income_statement JSONB,
        balance_sheet JSONB,
        cash_flow JSONB,
        recommendations JSONB,
        earnings_dates JSONB,
        earnings_history JSONB,
        earnings_trend JSONB,
        upgrades_downgrades JSONB,
        financial_data JSONB,
        news JSONB,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created stock_data table');
    
    // Add the 'news' column to stock_data if it doesn't exist
    // This ensures the news column is present in older database schemas
    console.log('Checking if news column exists in stock_data table...');
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'stock_data' AND column_name = 'news'
        ) THEN
          ALTER TABLE stock_data ADD COLUMN news JSONB;
          RAISE NOTICE 'Added news column to stock_data table';
        ELSE
          RAISE NOTICE 'News column already exists in stock_data table';
        END IF;
      END $$;
    `);
    
    // Create sectors table based on the stock_data_integration_guide.md
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sectors} (
        sector_key VARCHAR(50) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        performance_data JSONB,
        companies JSONB,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created sectors table');
    
    // Create market_data table based on the stock_data_integration_guide.md
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${marketData} (
        market_key VARCHAR(50) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        indices JSONB,
        performance_data JSONB,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created market_data table');
    
    // Create stock_news table based on the stock_data_integration_guide.md
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${stockNews} (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL REFERENCES ${stocks}(ticker),
        title TEXT NOT NULL,
        summary TEXT,
        published_date TIMESTAMP NOT NULL,
        source TEXT,
        url TEXT NOT NULL,
        sentiment TEXT,
        ai_analysis JSONB,
        impacted_metrics JSONB,
        created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created stock_news table');
    
    console.log('Database schema push completed successfully!');
  } catch (error) {
    console.error('Error pushing schema to database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();