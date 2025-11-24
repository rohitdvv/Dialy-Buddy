export enum HealthStatus {
  OPTIMAL = 'OPTIMAL',
  GOOD = 'GOOD',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum TabView {
  DASHBOARD = 'DASHBOARD',
  NUTRITION = 'NUTRITION',
  JOURNAL = 'JOURNAL',
  ACTIVITY = 'ACTIVITY',
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  foodName: string;
  analysis: string;
}

export interface JournalData {
  mood: string;
  stressLevel: number; // 1-10
  sentimentScore: number; // -1 to 1
  keyTopics: string[];
  summary: string;
}

export interface ActivityData {
  date: string;
  steps: number;
  sleepHours: number;
  sleepQuality: number; // 1-10
  heartRateAvg: number;
}

export interface Recommendation {
  category: 'DIET' | 'FITNESS' | 'STRESS' | 'SLEEP';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DailyAnalysis {
  nutrition: NutritionData[];
  journal: JournalData[];
  activity: ActivityData;
  recommendations: Recommendation[];
  wellnessScore: number;
}