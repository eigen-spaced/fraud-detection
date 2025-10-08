export interface TransactionData {
  transaction: {
    id: string;
    timestamp: string;
    merchant: {
      name: string;
      category: string;
      location: {
        lat: number;
        lng: number;
      };
    };
    amount: number;
    card: {
      number: string;
      full: string;
    };
    account: {
      number: string;
      full: string;
    };
  };
  model_features: {
    temporal: {
      trans_in_last_1h: number;
      trans_in_last_24h: number;
      trans_in_last_7d: number;
    };
    amount_ratios: {
      amt_per_card_avg_ratio_1h: number;
      amt_per_card_avg_ratio_24h: number;
      amt_per_card_avg_ratio_7d: number;
      amt_per_category_avg_ratio_1h: number;
      amt_per_category_avg_ratio_24h: number;
      amt_per_category_avg_ratio_7d: number;
    };
    deviations: {
      amt_diff_from_card_median_7d: number;
    };
  };
  ground_truth: {
    is_fraud: boolean;
  };
}

export interface TransactionBatch {
  transactions: TransactionData[];
}

// Category emoji mapping
export const categoryEmojis: Record<string, string> = {
  "Gas & Transport": "⛽",
  "Grocery": "🛒",
  "Restaurant": "🍽️",
  "Shopping": "🛍️",
  "Entertainment": "🎬",
  "Healthcare": "🏥",
  "Travel": "✈️",
  "Electronics": "💻",
  "Jewelry": "💎",
  "Gambling": "🎰",
  "Crypto": "₿",
  "Wire Transfer": "💸",
  "ATM Withdrawal": "🏧",
  "Online Shopping": "📱",
  "Default": "💳"
};

export const newSampleTransactions = {
  legitimate: {
    transactions: [
      {
        transaction: {
          id: "417473688cec715a2d4fc745a3267cc5",
          timestamp: "2023-01-01T14:30:00Z",
          merchant: {
            name: "Whole Foods Market",
            category: "Grocery",
            location: {
              lat: 37.7749,
              lng: -122.4194
            }
          },
          amount: 125.50,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 0.693147,
            trans_in_last_24h: 2.302585,
            trans_in_last_7d: 3.912023
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 1.125,
            amt_per_card_avg_ratio_24h: 1.050,
            amt_per_card_avg_ratio_7d: 0.980,
            amt_per_category_avg_ratio_1h: 0.950,
            amt_per_category_avg_ratio_24h: 0.920,
            amt_per_category_avg_ratio_7d: 0.890
          },
          deviations: {
            amt_diff_from_card_median_7d: 15.30
          }
        },
        ground_truth: {
          is_fraud: false
        }
      },
      {
        transaction: {
          id: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
          timestamp: "2023-01-01T16:45:00Z",
          merchant: {
            name: "Shell Gas Station",
            category: "Gas & Transport",
            location: {
              lat: 37.3382,
              lng: -121.8863
            }
          },
          amount: 45.00,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 1.386294,
            trans_in_last_24h: 2.995732,
            trans_in_last_7d: 4.220285
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 0.850,
            amt_per_card_avg_ratio_24h: 0.780,
            amt_per_card_avg_ratio_7d: 0.720,
            amt_per_category_avg_ratio_1h: 1.100,
            amt_per_category_avg_ratio_24h: 1.050,
            amt_per_category_avg_ratio_7d: 0.980
          },
          deviations: {
            amt_diff_from_card_median_7d: 5.00
          }
        },
        ground_truth: {
          is_fraud: false
        }
      }
    ]
  },
  suspicious: {
    transactions: [
      {
        transaction: {
          id: "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
          timestamp: "2023-01-02T03:15:00Z",
          merchant: {
            name: "Luxury Watch Boutique",
            category: "Jewelry",
            location: {
              lat: 36.1699,
              lng: -115.1398
            }
          },
          amount: 1850.00,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 0.693147,
            trans_in_last_24h: 1.386294,
            trans_in_last_7d: 3.555348
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 12.450,
            amt_per_card_avg_ratio_24h: 8.920,
            amt_per_card_avg_ratio_7d: 5.670,
            amt_per_category_avg_ratio_1h: 15.230,
            amt_per_category_avg_ratio_24h: 10.450,
            amt_per_category_avg_ratio_7d: 7.890
          },
          deviations: {
            amt_diff_from_card_median_7d: 1720.50
          }
        },
        ground_truth: {
          is_fraud: false
        }
      },
      {
        transaction: {
          id: "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8",
          timestamp: "2023-01-02T03:30:00Z",
          merchant: {
            name: "Casino Resort",
            category: "Gambling",
            location: {
              lat: 36.1147,
              lng: -115.1729
            }
          },
          amount: 2200.00,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 1.386294,
            trans_in_last_24h: 2.079442,
            trans_in_last_7d: 3.784190
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 18.670,
            amt_per_card_avg_ratio_24h: 11.340,
            amt_per_card_avg_ratio_7d: 6.780,
            amt_per_category_avg_ratio_1h: 22.890,
            amt_per_category_avg_ratio_24h: 14.560,
            amt_per_category_avg_ratio_7d: 9.230
          },
          deviations: {
            amt_diff_from_card_median_7d: 2070.30
          }
        },
        ground_truth: {
          is_fraud: false
        }
      }
    ]
  },
  fraudulent: {
    transactions: [
      {
        transaction: {
          id: "d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9",
          timestamp: "2023-01-03T04:20:00Z",
          merchant: {
            name: "Quick Cash Transfer",
            category: "Wire Transfer",
            location: {
              lat: 51.5074,
              lng: -0.1278
            }
          },
          amount: 8500.00,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 0.693147,
            trans_in_last_24h: 0.693147,
            trans_in_last_7d: 2.302585
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 45.670,
            amt_per_card_avg_ratio_24h: 38.920,
            amt_per_card_avg_ratio_7d: 22.450,
            amt_per_category_avg_ratio_1h: 89.340,
            amt_per_category_avg_ratio_24h: 67.890,
            amt_per_category_avg_ratio_7d: 45.230
          },
          deviations: {
            amt_diff_from_card_median_7d: 8370.50
          }
        },
        ground_truth: {
          is_fraud: true
        }
      },
      {
        transaction: {
          id: "e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
          timestamp: "2023-01-03T04:25:00Z",
          merchant: {
            name: "Instant Crypto Exchange",
            category: "Crypto",
            location: {
              lat: 1.3521,
              lng: 103.8198
            }
          },
          amount: 6200.00,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 1.386294,
            trans_in_last_24h: 1.386294,
            trans_in_last_7d: 2.772589
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 52.340,
            amt_per_card_avg_ratio_24h: 41.670,
            amt_per_card_avg_ratio_7d: 28.920,
            amt_per_category_avg_ratio_1h: 78.560,
            amt_per_category_avg_ratio_24h: 59.230,
            amt_per_category_avg_ratio_7d: 38.450
          },
          deviations: {
            amt_diff_from_card_median_7d: 6070.30
          }
        },
        ground_truth: {
          is_fraud: true
        }
      }
    ]
  },
  mixed: {
    transactions: [
      {
        transaction: {
          id: "f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1",
          timestamp: "2023-01-04T10:00:00Z",
          merchant: {
            name: "Starbucks Coffee",
            category: "Restaurant",
            location: {
              lat: 47.6062,
              lng: -122.3321
            }
          },
          amount: 12.50,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 0.693147,
            trans_in_last_24h: 1.945910,
            trans_in_last_7d: 3.583519
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 0.650,
            amt_per_card_avg_ratio_24h: 0.580,
            amt_per_card_avg_ratio_7d: 0.520,
            amt_per_category_avg_ratio_1h: 0.890,
            amt_per_category_avg_ratio_24h: 0.820,
            amt_per_category_avg_ratio_7d: 0.760
          },
          deviations: {
            amt_diff_from_card_median_7d: -17.80
          }
        },
        ground_truth: {
          is_fraud: false
        }
      },
      {
        transaction: {
          id: "g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2",
          timestamp: "2023-01-04T15:30:00Z",
          merchant: {
            name: "Best Buy Electronics",
            category: "Electronics",
            location: {
              lat: 47.6205,
              lng: -122.3493
            }
          },
          amount: 1500.00,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 0.693147,
            trans_in_last_24h: 2.302585,
            trans_in_last_7d: 3.891820
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 7.890,
            amt_per_card_avg_ratio_24h: 5.670,
            amt_per_card_avg_ratio_7d: 3.450,
            amt_per_category_avg_ratio_1h: 9.230,
            amt_per_category_avg_ratio_24h: 6.780,
            amt_per_category_avg_ratio_7d: 4.560
          },
          deviations: {
            amt_diff_from_card_median_7d: 1370.30
          }
        },
        ground_truth: {
          is_fraud: false
        }
      },
      {
        transaction: {
          id: "h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3",
          timestamp: "2023-01-04T23:45:00Z",
          merchant: {
            name: "Online Gambling Site",
            category: "Gambling",
            location: {
              lat: 25.7617,
              lng: -80.1918
            }
          },
          amount: 5200.00,
          card: {
            number: "••••1234",
            full: "5424000111111234"
          },
          account: {
            number: "••••5556",
            full: "279317935556"
          }
        },
        model_features: {
          temporal: {
            trans_in_last_1h: 0.693147,
            trans_in_last_24h: 2.079442,
            trans_in_last_7d: 4.094345
          },
          amount_ratios: {
            amt_per_card_avg_ratio_1h: 34.560,
            amt_per_card_avg_ratio_24h: 24.890,
            amt_per_card_avg_ratio_7d: 16.780,
            amt_per_category_avg_ratio_1h: 45.670,
            amt_per_category_avg_ratio_24h: 32.340,
            amt_per_category_avg_ratio_7d: 21.230
          },
          deviations: {
            amt_diff_from_card_median_7d: 5070.30
          }
        },
        ground_truth: {
          is_fraud: true
        }
      }
    ]
  }
};