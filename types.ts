
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
  CHAT = 'CHAT',
  GUIDE = 'GUIDE',
}

export interface User {
  name: string;
  email: string;
  id: string;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  foodName: string;
  analysis: string;
  timestamp: string; // Added timestamp
}

export interface JournalData {
  mood: string;
  stressLevel: number; // 1-10
  sentimentScore: number; // -1 to 1
  keyTopics: string[];
  summary: string;
  timestamp: string; // ISO Date string
}

export interface ActivityData {
  date: string;
  steps: number;
  sleepHours: number;
  sleepQuality: number; // 1-10
  heartRateAvg: number;
  caloriesBurned: number;
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

export interface DeviceConnection {
  id: string;
  name: string;
  type: 'CLOUD' | 'BLUETOOTH';
  status: 'CONNECTED' | 'DISCONNECTED';
  lastSync?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}