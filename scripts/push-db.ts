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
    
    // Create stocks table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${stocks} (
        ticker VARCHAR(10) PRIMARY KEY,
        company_name TEXT NOT NULL,
        sector TEXT,
        industry TEXT,
        current_price NUMERIC,
        market_cap NUMERIC,
        dividend_yield NUMERIC,
        beta NUMERIC,
        pe_ratio NUMERIC,
        eps NUMERIC,
        fifty_two_week_high NUMERIC,
        fifty_two_week_low NUMERIC,
        average_volume NUMERIC,
        description TEXT
      )
    `);
    console.log('Created stocks table');
    
    // Create stock_data table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${stockData} (
        ticker VARCHAR(10) PRIMARY KEY REFERENCES ${stocks}(ticker),
        closing_history JSONB,
        dividends JSONB,
        income_statement JSONB,
        balance_sheet JSONB,
        cash_flow JSONB,
        recommendations JSONB,
        earnings_dates JSONB,
        earnings_history JSONB,
        earnings_trend JSONB,
        upgrades_downgrades JSONB,
        financial_data JSONB,
        institutional_holders JSONB,
        major_holders JSONB
      )
    `);
    console.log('Created stock_data table');
    
    // Create sectors table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sectors} (
        sector_key VARCHAR(50) PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        metrics JSONB
      )
    `);
    console.log('Created sectors table');
    
    // Create market_data table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${marketData} (
        market VARCHAR(20) PRIMARY KEY,
        name TEXT NOT NULL,
        metrics JSONB,
        last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created market_data table');
    
    // Create stock_news table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${stockNews} (
        id SERIAL PRIMARY KEY,
        ticker VARCHAR(10) NOT NULL REFERENCES ${stocks}(ticker),
        title TEXT NOT NULL,
        summary TEXT,
        url TEXT NOT NULL,
        source TEXT,
        published_date TIMESTAMP NOT NULL,
        impacted_metrics JSONB,
        ai_analysis JSONB,
        sentiment TEXT,
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