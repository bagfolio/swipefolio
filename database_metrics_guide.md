# Stock Data Database Structure Guide

This guide documents the structure of the stock data in both the JSON files and PostgreSQL database to help the AI easily locate specific metrics.

## Database Tables

The PostgreSQL database has the following key tables:

1. `stocks` - Basic stock information (ticker, company_name, sector, industry)
2. `financial_statements` - All financial statement data (income_stmt, balance_sheet, cash_flow)
3. `stock_info` - General stock information and key stats
4. `price_history` - Stock price historical data
5. `stock_news` - News articles
6. `earnings_history` - Historical earnings data
7. `analyst_recommendations` - Analyst ratings and recommendations
8. `upgrades_downgrades` - Stock upgrades and downgrades
9. `stock_ai_analysis` - AI-generated analysis of stocks
10. `stock_news_summary` - AI-generated news summaries
11. `stock_company_overview` - AI-generated company overviews

## Key Metrics Location Guide

### Core Financial Metrics

| Metric Name | Location in JSON | PostgreSQL Table | Column/Field | Notes |
|-------------|------------------|------------------|--------------|-------|
| P/E Ratio | `info.trailingPE` | `stock_info` | `trailing_pe` | For current P/E |
| Forward P/E | `info.forwardPE` | `stock_info` | `forward_pe` | Expected future P/E |
| P/B Ratio | `info.priceToBook` | `stock_info` | `price_to_book` | Price-to-Book ratio |
| Profit Margin | `info.profitMargins` | `stock_info` | `profit_margins` | As a decimal (multiply by 100 for percentage) |
| Operating Margin | `info.operatingMargins` | `stock_info` | `operating_margins` | Operating profit as % of revenue |
| Revenue Growth | See calculation below | `financial_statements` | Calculate from income_stmt | Calculate YoY change in revenue |
| EPS | `info.trailingEps` | `stock_info` | `trailing_eps` | Trailing 12 months EPS |
| Dividend Yield | `info.dividendYield` | `stock_info` | `dividend_yield` | As a decimal (multiply by 100 for percentage) |
| Beta | `info.beta` | `stock_info` | `beta` | Stock volatility relative to market |
| Market Cap | `info.marketCap` | `stock_info` | `market_cap` | Total market value |
| 52-Week High | `info.fiftyTwoWeekHigh` | `stock_info` | `fifty_two_week_high` | Highest price in last 52 weeks |
| 52-Week Low | `info.fiftyTwoWeekLow` | `stock_info` | `fifty_two_week_low` | Lowest price in last 52 weeks |
| Current Price | `info.currentPrice` | `stock_info` | `current_price` | Most recent price |

### Calculated Metrics (require formulas)

| Metric Name | Calculation Method | Required Data | SQL Query Example |
|-------------|-------------------|---------------|-------------------|
| Revenue Growth | (Current Year Revenue - Previous Year Revenue) / Previous Year Revenue | From income_stmt | See query example below |
| Return on Capital | Net Income / (Total Assets - Current Liabilities) | From income_stmt and balance_sheet | Combine data from both statements |
| Three Month Return | (Current Price - Price 3 Months Ago) / Price 3 Months Ago | From price_history | Calculate using price data |
| RSI (Relative Strength Index) | Complex formula using price history | From price_history | Use specialized function |
| Volatility | Standard deviation of price changes | From price_history | Calculate using statistical functions |

### Query Examples for Calculated Metrics

#### Revenue Growth
```sql
WITH yearly_revenue AS (
  SELECT 
    ticker,
    date,
    data->>'totalRevenue' AS revenue
  FROM financial_statements
  WHERE type = 'income_stmt' AND period = 'annual'
  ORDER BY date DESC
  LIMIT 2
)
SELECT 
  ticker,
  (
    (SELECT revenue::numeric FROM yearly_revenue ORDER BY date DESC LIMIT 1) - 
    (SELECT revenue::numeric FROM yearly_revenue ORDER BY date DESC OFFSET 1 LIMIT 1)
  ) / 
  (SELECT revenue::numeric FROM yearly_revenue ORDER BY date DESC OFFSET 1 LIMIT 1) * 100 AS revenue_growth
FROM yearly_revenue
GROUP BY ticker;
```

#### Return on Capital
```sql
WITH latest_data AS (
  SELECT 
    i.ticker,
    (i.data->>'netIncome')::numeric AS net_income,
    (b.data->>'totalAssets')::numeric AS total_assets,
    (b.data->>'totalCurrentLiabilities')::numeric AS current_liabilities
  FROM 
    financial_statements i
    JOIN financial_statements b ON i.ticker = b.ticker AND i.date = b.date
  WHERE 
    i.type = 'income_stmt' AND b.type = 'balance_sheet'
    AND i.period = 'annual' AND b.period = 'annual'
  ORDER BY i.date DESC
  LIMIT 1
)
SELECT
  ticker,
  net_income / (total_assets - current_liabilities) * 100 AS return_on_capital
FROM latest_data;
```

## Columnar Data Format Guide

The optimized columnar format used in the JSON files stores arrays of values rather than repeating keys, which makes it more efficient. Here's how to understand and access this format:

### Example: Price History (Traditional vs. Columnar)

Traditional format (not used):
```json
"price_history": [
  {"date": "2023-01-01", "open": 150.23, "close": 153.45, "high": 155.00, "low": 149.80, "volume": 12345678},
  {"date": "2023-01-02", "open": 154.10, "close": 156.78, "high": 157.50, "low": 153.25, "volume": 9876543}
]
```

Our columnar format:
```json
"price_history": {
  "Date": ["2023-01-01", "2023-01-02"],
  "Open": [150.23, 154.10],
  "Close": [153.45, 156.78],
  "High": [155.00, 157.50],
  "Low": [149.80, 153.25],
  "Volume": [12345678, 9876543]
}
```

### Financial Statements Format

Financial statements use nested columnar format:

```json
"income_stmt": {
  "Dates": ["2021-12-31", "2022-12-31", "2023-12-31"],
  "TotalRevenue": [365817000000, 394328000000, 383289000000],
  "CostOfRevenue": [212981000000, 223546000000, 214137000000],
  "GrossProfit": [152836000000, 170782000000, 169152000000],
  "OperatingIncome": [108949000000, 119437000000, 114301000000],
  "NetIncome": [94680000000, 99803000000, 96995000000],
  "EPS": [5.61, 6.11, 6.14]
}
```

## Special Cases and Exceptions

1. **Different Naming Conventions**: Some metrics may have different names:
   - `PriceToBook` in JSON vs `price_to_book` in PostgreSQL
   - `TrailingPE` vs `trailing_pe` vs `pe_ratio`

2. **Null/Missing Values**: Some stocks may not have all metrics available:
   - Check for null values in PostgreSQL
   - Check if key exists in JSON before accessing

3. **Calculation Timing**: Some metrics are calculated at runtime:
   - metrics_calculator.py calculates values like RSI, revenue growth
   - Values may not be directly stored in the database

4. **Units and Scaling**:
   - Financial statement values often in millions/billions
   - Ratios and percentages stored as decimals (multiply by 100 for display)

## Metrics Mapping for AI Analysis

The AI analysis focuses on these core metric categories:

### Performance
- Revenue Growth: income_stmt.TotalRevenue (calculate YoY change)
- Profit Margin: info.profitMargins or (income_stmt.NetIncome / income_stmt.TotalRevenue)
- Return on Capital: (income_stmt.NetIncome / (balance_sheet.TotalAssets - balance_sheet.TotalCurrentLiabilities))

### Value
- PE Ratio: info.trailingPE
- PB Ratio: info.priceToBook
- Dividend Yield: info.dividendYield
- Forward PE: info.forwardPE

### Momentum
- Three Month Return: Calculate from price_history
- Relative Strength: Compare against sector/market performance
- RSI: Calculate from price_history using standard RSI formula

### Stability
- Beta: info.beta
- Volatility: Calculate standard deviation from price_history
- Dividend Consistency: Analyze dividend history consistency