export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'done';
export type HabitCategory = 'sport' | 'learning' | 'health' | 'namoz' | 'other';
export type PrayerStatus = 'todo' | 'ontime' | 'late' | 'missed';

export interface Task {
  id: string;
  title: string;
  description: string;
  date: string;
  priority: Priority;
  status: TaskStatus;
  subTasks: string[];
  reminders: string[];
}

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  completedDates: string[]; // For regular habits
  prayerHistory?: Record<string, PrayerStatus>; // For namoz category: { "2023-10-25": "ontime" }
}

export interface DailyChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface DisciplineData {
  date: string;
  score: number;
}
