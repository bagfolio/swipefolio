import React from 'react';
import { Brain, Heart, Building2, LineChart, Users, TrendingUp, Star } from 'lucide-react';
import type { Stock, Decision, MetricQuestion } from '@/types/game';

export const GAME_CONSTANTS = {
  GAME_TIME_LIMIT: 120, // seconds
  QUESTIONS_PER_GAME: 10,
  TICKETS_PER_10_CORRECT: 1,
};

export const STOCK_TIERS = [
  { name: "Penny Stocks", minPrice: 0.05, maxPrice: 1, requiredLevel: 1 },
  { name: "Small Caps", minPrice: 1, maxPrice: 10, requiredLevel: 2 },
  { name: "Mid Caps", minPrice: 10, maxPrice: 50, requiredLevel: 3 },
  { name: "Large Caps", minPrice: 50, maxPrice: 200, requiredLevel: 5 },
  { name: "Blue Chips", minPrice: 200, maxPrice: 1000, requiredLevel: 8 }
];

export const METRIC_QUESTIONS: MetricQuestion[] = [
  {
    id: 1,
    metric: "Revenue Growth",
    explanation: "Revenue growth measures the percentage increase in a company's revenue over a specific period. A higher growth rate indicates strong business performance and market demand.",
    companyValue: 15.5,
    industryAverage: 8.2,
    isGood: true
  },
  {
    id: 2,
    metric: "Operating Margin",
    explanation: "Operating margin shows the percentage of revenue that remains after covering operating expenses. A higher margin indicates better efficiency and profitability.",
    companyValue: 12.3,
    industryAverage: 18.5,
    isGood: false
  },
  {
    id: 3,
    metric: "Customer Acquisition Cost (CAC)",
    explanation: "CAC measures the cost of acquiring a new customer. A lower CAC relative to industry average indicates more efficient marketing and sales processes.",
    companyValue: 45,
    industryAverage: 65,
    isGood: true
  },
  {
    id: 4,
    metric: "Employee Turnover Rate",
    explanation: "Employee turnover rate shows the percentage of employees who leave the company within a year. A higher rate than industry average suggests potential workplace issues.",
    companyValue: 25,
    industryAverage: 15,
    isGood: false
  },
  {
    id: 5,
    metric: "Research & Development Investment",
    explanation: "R&D investment as a percentage of revenue indicates a company's commitment to innovation. Higher investment than industry average often leads to future growth.",
    companyValue: 8.5,
    industryAverage: 5.2,
    isGood: true
  },
  {
    id: 6,
    metric: "Debt-to-Equity Ratio",
    explanation: "This ratio compares a company's total debt to its shareholder equity. A higher ratio than industry average indicates more financial risk.",
    companyValue: 2.8,
    industryAverage: 1.5,
    isGood: false
  },
  {
    id: 7,
    metric: "Customer Satisfaction Score",
    explanation: "Customer satisfaction measures how happy customers are with the company's products or services. A higher score than industry average indicates better customer service.",
    companyValue: 92,
    industryAverage: 85,
    isGood: true
  },
  {
    id: 8,
    metric: "Inventory Turnover",
    explanation: "Inventory turnover shows how many times a company sells and replaces its inventory in a period. A higher ratio than industry average suggests better inventory management.",
    companyValue: 8.7,
    industryAverage: 6.2,
    isGood: true
  },
  {
    id: 9,
    metric: "Price-to-Earnings Ratio (P/E)",
    explanation: "P/E ratio compares a company's stock price to its earnings per share. A higher ratio than industry average may indicate overvaluation.",
    companyValue: 35.2,
    industryAverage: 22.8,
    isGood: false
  },
  {
    id: 10,
    metric: "Net Promoter Score",
    explanation: "Net Promoter Score measures customer loyalty and willingness to recommend a company. A higher score than industry average indicates stronger customer loyalty.",
    companyValue: 65,
    industryAverage: 45,
    isGood: true
  },
  {
    id: 11,
    metric: "Accounts Receivable Turnover",
    explanation: "This ratio measures how efficiently a company collects its credit sales. A higher ratio than industry average indicates better collection practices.",
    companyValue: 12.5,
    industryAverage: 9.8,
    isGood: true
  },
  {
    id: 12,
    metric: "Cash Conversion Cycle",
    explanation: "Cash conversion cycle shows how long it takes for a company to convert investments into cash flows. A shorter cycle than industry average indicates better cash management.",
    companyValue: 85,
    industryAverage: 65,
    isGood: false
  }
];