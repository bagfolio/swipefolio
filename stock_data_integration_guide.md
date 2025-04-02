# Stock Data Integration Guide

This guide provides comprehensive information about the stock data service and how to integrate it with your application. The service provides rich financial data for approximately 50 ticker symbols, with data stored in both JSON files and a PostgreSQL database.

## Data Sources Overview

The data is available through two main sources:

1. **JSON Files**
   - Located in the `stock_data/` directory
   - Each ticker has its own JSON file (e.g., `AAPL.json`)
   - Data is stored in an efficient columnar format
   - Complete and most detailed data set

2. **PostgreSQL Database**
   - Structured data optimized for queries
   - Contains both basic stock information and detailed JSON data
   - Accessible via standard SQL queries

## PostgreSQL Database Structure

### Connection Details
- The database connection details are available in the `DATABASE_URL` environment variable
- Format: `postgresql://username:password@hostname:port/database`

### Tables

1. **`stocks`** - Basic stock information
   - `ticker` (Primary Key)
   - `company_name`
   - `sector`
   - `industry`
   - `country`
   - `exchange`
   - `currency`
   - `market_cap`
   - `current_price`
   - `target_price`
   - `price_to_earnings`
   - `dividend_yield`
   - `beta`
   - `last_updated`

2. **`stock_data`** - Detailed stock data in JSONB format
   - `ticker` (Primary Key)
   - `closing_history` (JSONB)
   - `dividends` (JSONB)
   - `institutional_holders` (JSONB)
   - `major_holders` (JSONB)
   - `income_statement` (JSONB)
   - `balance_sheet` (JSONB)
   - `cash_flow` (JSONB)
   - `recommendations` (JSONB)
   - `earnings_dates` (JSONB)
   - `earnings_history` (JSONB)
   - `earnings_trend` (JSONB)
   - `upgrades_downgrades` (JSONB)
   - `financial_data` (JSONB)
   - `news` (JSONB)
   - `last_updated`

3. **`sectors`** - Sector information
   - `sector_key` (Primary Key)
   - `name`
   - `description`
   - `performance_data` (JSONB)
   - `companies` (JSONB)
   - `last_updated`

4. **`market_data`** - Market information
   - `market_key` (Primary Key)
   - `name`
   - `description`
   - `indices` (JSONB)
   - `performance_data` (JSONB)
   - `last_updated`

5. **`stock_news`** - Dedicated news table
   - `id` (Primary Key)
   - `ticker`
   - `title`
   - `summary`
   - `published_date`
   - `source`
   - `url`
   - `sentiment`
   - `ai_analysis`
   - `impacted_metrics`
   - `created`

## Data Model Details

### Stock Data Fields

The following fields are available in the stock_data JSON files and can be accessed through the PostgreSQL database:

#### Basic Information
- `info` - General stock information
- `isin` - International Securities Identification Number
- `options` - Available options chain dates

#### Price Data
- `history` - 1 year of detailed price history (Open, High, Low, Close, Volume)
- `closing_history_5y` - 5 years of closing prices only (more efficient for trend analysis)
- `dividends` - Dividend payment history
- `splits` - Stock split history

#### Financial Statements
- `income_stmt_annual` - Annual income statements (columnar format)
- `income_stmt_quarterly` - Quarterly income statements (columnar format)
- `balance_sheet_annual` - Annual balance sheets (columnar format)
- `balance_sheet_quarterly` - Quarterly balance sheets (columnar format)
- `cash_flow_annual` - Annual cash flow statements (columnar format)
- `cash_flow_quarterly` - Quarterly cash flow statements (columnar format)

#### Earnings Data
- `calendar` - Upcoming earnings events
- `earnings_dates` - Historical earnings announcement dates and EPS surprises
- `earnings_history` - Detailed earnings history with estimates and actuals
- `earnings_estimate` - Analyst earnings estimates
- `revenue_estimate` - Analyst revenue estimates
- `eps_revisions` - EPS estimate revisions
- `eps_trend` - EPS estimate trends
- `growth_estimates` - Long-term growth estimates

#### Analyst Data
- `recommendations` - Analyst buy/sell recommendations history
- `upgrades_downgrades_3y` - Analyst upgrades/downgrades for past 3 years
- `analyst_price_target` - Consensus price targets

#### Ownership Data
- `major_holders` - Major shareholders percentage breakdown
- `institutional_holders` - Top institutional shareholders (columnar format)
- `mutualfund_holders` - Top mutual fund shareholders (columnar format)

#### News Data
- `news` - Latest news articles in columnar format with:
  - `id` - Unique news ID
  - `title` - Article title
  - `publisher` - News source
  - `url` - Article URL
  - `publishDate` - Publication date (YYYY-MM-DD)
  - `contentType` - Type of content
  - `summary` - Brief article summary

## Known Data Limitations

1. **Financial Statements** - Some tickers might have empty income statement, balance sheet, or cash flow data in the database. This occurs because:
   - The data in the JSON files is stored under different field names than in the database
   - In the JSON files, data is stored as `income_stmt_annual` and `income_stmt_quarterly` but in the database as `income_statement`
   - Some tickers (especially mutual funds like BJS) don't have financial statements

2. **News Data** - News availability varies by ticker:
   - Most major stocks have comprehensive news coverage
   - Less popular tickers and mutual funds may have limited or no news
   - The `stock_news` table contains additional AI-analyzed news that may not be present in the JSON files

## Accessing the Data

### Direct PostgreSQL Queries

For direct database access, you can use standard SQL queries:

```python
import psycopg2
import json
import os

# Connect using the DATABASE_URL environment variable
conn = psycopg2.connect(os.environ['DATABASE_URL'])
cursor = conn.cursor()

# Example: Get basic info for a ticker
cursor.execute("SELECT * FROM stocks WHERE ticker = %s", ('AAPL',))
basic_info = cursor.fetchone()

# Example: Get detailed financial data for a ticker
cursor.execute("SELECT income_statement FROM stock_data WHERE ticker = %s", ('AAPL',))
income_statement = cursor.fetchone()[0]  # This is a JSONB object

# Example: Get news for a ticker using dedicated news table
cursor.execute("SELECT * FROM stock_news WHERE ticker = %s ORDER BY published_date DESC LIMIT 10", ('AAPL',))
news_articles = cursor.fetchall()

# Close the connection
cursor.close()
conn.close()
```

### Using the API Module

The project includes a `postgres_api.py` module for easier data access:

```python
from postgres_api import StockDataAPI

# Initialize the API
api = StockDataAPI()

# Get basic stock information
stock_info = api.get_stock_info('AAPL')

# Get detailed stock data
stock_data = api.get_stock_data('AAPL')

# Get news for a ticker
news = api.get_news('AAPL', limit=10)

# Get sector data
tech_sector = api.get_sector('technology')

# Close the connection when done
api.close()
```

## Updating the Data

The system includes several scripts to update the data:

1. **`fetch_all_stock_data.py`** - Fetches all stock data and saves to JSON files
2. **`export_to_postgres.py`** - Exports JSON data to PostgreSQL
3. **`update_all_data.py`** - Combined script to fetch fresh data and update PostgreSQL
4. **`update_news_data.py`** - Script to specifically update news data

To schedule updates, consider running these scripts on a regular basis (e.g., 1-2 times daily).

## Columnar Data Format

The data uses an efficient columnar format which significantly reduces file sizes and improves processing speed:

### Traditional Array of Objects:
```json
[
  {"date": "2023-01-01", "value": 100, "change": 0.05},
  {"date": "2023-01-02", "value": 102, "change": 0.02},
  {"date": "2023-01-03", "value": 98, "change": -0.04}
]
```

### Columnar Format:
```json
{
  "date": ["2023-01-01", "2023-01-02", "2023-01-03"],
  "value": [100, 102, 98],
  "change": [0.05, 0.02, -0.04]
}
```

This format has these benefits:
- Reduced file size (field names appear only once)
- More efficient processing (arrays of primitive types)
- Easier columnar operations
- Less token usage for AI applications

## Integration Best Practices

1. **Use Database for Quick Lookups**
   - Basic information and filtering should use SQL queries
   - Use the dedicated indexes on sector, industry, country, and market_cap

2. **Use JSON for Deep Analysis**
   - When you need the full detailed data set
   - For back-testing with historical data
   - For custom financial analysis

3. **Handling Empty Fields**
   - Always check if a field exists and has data before using it
   - For financial statements, check both the database field (e.g., `income_statement`) and the JSON field variants (e.g., `income_stmt_annual`)

4. **Performance Considerations**
   - Use `LIMIT` in queries when possible
   - When working with JSONB fields, use PostgreSQL's JSONB operators
   - Consider caching frequently accessed data

## Troubleshooting

### Missing Financial Data
If financial statement data is missing in the database:

1. Check if the data exists in the JSON files under alternative field names
2. Run a dedicated update: `python update_postgres_data.py --export-only`
3. For specific tickers that need financial data, use the YFinance library directly

### Connection Issues
If database connection fails:

1. Verify the `DATABASE_URL` environment variable is correctly set
2. Check network connectivity to the database server
3. Ensure the database server is running

## Future Improvements

The data service is designed for these upcoming enhancements:

1. AI integration for sentiment analysis and financial translation
2. More comprehensive sector and market indices
3. Dedicated financial statement extraction and normalization
4. Historical price data with varying time periods
5. Custom portfolio tracking and analysis

## Support and Feedback

For questions, issues, or feedback about the stock data integration, please contact the development team.