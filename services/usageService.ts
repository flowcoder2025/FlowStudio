import { ESTIMATED_COST_PER_IMAGE_USD } from '@/constants';

const STORAGE_KEY = 'bizai_usage_stats_v1';

export interface DailyUsage {
  date: string;
  count: number;
}

export const getUsageHistory = (): DailyUsage[] => {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse usage stats", e);
    return [];
  }
};

export const recordUsage = (count: number) => {
  if (typeof window === 'undefined') return;

  try {
    const history = getUsageHistory();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const existingIndex = history.findIndex(h => h.date === today);
    if (existingIndex >= 0) {
      history[existingIndex].count += count;
    } else {
      history.push({ date: today, count });
    }

    // Keep last 30 days only
    const trimmedHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (e) {
    console.error("Failed to save usage stats", e);
  }
};

export const getUsageStats = () => {
  const history = getUsageHistory();
  const totalImages = history.reduce((acc, curr) => acc + curr.count, 0);
  const totalCostUsd = totalImages * ESTIMATED_COST_PER_IMAGE_USD;

  const today = new Date().toISOString().split('T')[0];
  const todayUsage = history.find(h => h.date === today)?.count || 0;

  return {
    totalImages,
    totalCostUsd,
    todayUsage,
    history
  };
};

export const clearUsageStats = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};
