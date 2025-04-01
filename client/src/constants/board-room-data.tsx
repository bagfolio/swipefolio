export interface Decision {
  scenario: string;
  context: string;
  optionA: {
    text: string;
    impacts: {
      metric: string;
      value: number;
      explanation: string;
    }[];
  };
  optionB: {
    text: string;
    impacts: {
      metric: string;
      value: number;
      explanation: string;
    }[];
  };
}

export const BOARD_ROOM_DECISIONS: Decision[] = [
  {
    scenario: "Market Expansion Strategy",
    context: "Your company needs to decide how to expand market presence.",
    optionA: {
      text: "Aggressive expansion into new markets",
      impacts: [
        {
          metric: "Market Share",
          value: 25,
          explanation: "Significant market share growth potential"
        },
        {
          metric: "Profit Margin",
          value: -15,
          explanation: "Higher costs due to rapid scaling"
        }
      ]
    },
    optionB: {
      text: "Gradual expansion focusing on core markets",
      impacts: [
        {
          metric: "Revenue Growth",
          value: 10,
          explanation: "Steady but slower growth"
        },
        {
          metric: "Profit Margin",
          value: 5,
          explanation: "Better cost efficiency"
        }
      ]
    }
  },
  {
    scenario: "Product Development Approach",
    context: "The R&D team has presented two paths for new product development.",
    optionA: {
      text: "Develop breakthrough innovative product",
      impacts: [
        {
          metric: "Brand Value",
          value: 20,
          explanation: "Enhanced reputation as an innovator"
        },
        {
          metric: "Revenue Growth",
          value: -5,
          explanation: "Longer time to market"
        }
      ]
    },
    optionB: {
      text: "Iterate on existing products with new features",
      impacts: [
        {
          metric: "Revenue Growth",
          value: 15,
          explanation: "Faster time to market"
        },
        {
          metric: "Brand Value",
          value: -5,
          explanation: "Lower innovation perception"
        }
      ]
    }
  },
  {
    scenario: "Digital Transformation",
    context: "Your board is debating how to approach digital transformation.",
    optionA: {
      text: "Complete overhaul of systems and processes",
      impacts: [
        {
          metric: "Profit Margin",
          value: -20,
          explanation: "High implementation costs"
        },
        {
          metric: "Revenue Growth",
          value: 20,
          explanation: "Improved efficiency and new revenue streams"
        }
      ]
    },
    optionB: {
      text: "Gradual digital adoption focusing on customer-facing systems",
      impacts: [
        {
          metric: "Market Share",
          value: 10,
          explanation: "Improved customer experience and retention"
        },
        {
          metric: "Brand Value",
          value: 5,
          explanation: "Perceived as moderately progressive"
        }
      ]
    }
  },
  {
    scenario: "Sustainability Initiative",
    context: "Stakeholders are demanding stronger environmental commitments.",
    optionA: {
      text: "Implement comprehensive sustainability program",
      impacts: [
        {
          metric: "Brand Value",
          value: 30,
          explanation: "Strong positive impact on brand reputation"
        },
        {
          metric: "Profit Margin",
          value: -12,
          explanation: "High implementation costs"
        }
      ]
    },
    optionB: {
      text: "Focus on cost-effective green initiatives",
      impacts: [
        {
          metric: "Market Share",
          value: 8,
          explanation: "Moderate appeal to environmentally conscious consumers"
        },
        {
          metric: "Revenue Growth",
          value: 5,
          explanation: "New eco-friendly product offerings"
        }
      ]
    }
  },
  {
    scenario: "Talent Management Crisis",
    context: "Your company is facing high turnover in key positions.",
    optionA: {
      text: "Increase compensation and benefits package",
      impacts: [
        {
          metric: "Profit Margin",
          value: -10,
          explanation: "Higher operational costs"
        },
        {
          metric: "Revenue Growth",
          value: 15,
          explanation: "Better talent retention leads to improved productivity"
        }
      ]
    },
    optionB: {
      text: "Invest in better work environment and company culture",
      impacts: [
        {
          metric: "Profit Margin",
          value: -5,
          explanation: "Moderate implementation costs"
        },
        {
          metric: "Brand Value",
          value: 15,
          explanation: "Reputation as an employer of choice"
        }
      ]
    }
  }
];