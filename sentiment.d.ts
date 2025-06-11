declare module 'sentiment' {
  export interface SentimentResult {
    score: number;
    comparative: number;
    calculation: Record<string, number>;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  export default class Sentiment {
    constructor(options?: any);
    analyze(phrase: string, options?: any): SentimentResult;
  }
}
