
import { WordData, ReviewItem, REVIEW_INTERVALS } from './types';

const STORAGE_KEY = 'flash10_review_data';

export const ReviewService = {
  getQueue(): ReviewItem[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveToQueue(word: WordData) {
    const queue = this.getQueue();
    const now = Date.now();
    
    // Check if already in queue
    const existingIdx = queue.findIndex(item => item.wordData.word === word.word);
    
    if (existingIdx >= 0) {
      const item = queue[existingIdx];
      const nextStage = Math.min(item.stage + 1, REVIEW_INTERVALS.length - 1);
      queue[existingIdx] = {
        ...item,
        lastMasteredAt: now,
        stage: nextStage,
        nextReviewAt: now + REVIEW_INTERVALS[nextStage]
      };
    } else {
      queue.push({
        wordData: word,
        lastMasteredAt: now,
        stage: 1,
        nextReviewAt: now + REVIEW_INTERVALS[1]
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    this.scheduleNotification(word, REVIEW_INTERVALS[1]);
  },

  getDueItems(): ReviewItem[] {
    const now = Date.now();
    return this.getQueue().filter(item => now >= item.nextReviewAt);
  },

  removeFromQueue(word: string) {
    const queue = this.getQueue().filter(item => item.wordData.word !== word);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  },

  requestPermission() {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  },

  scheduleNotification(word: WordData, delay: number) {
    if ('Notification' in window && Notification.permission === 'granted') {
      // In a real web app, true background notifications need a Service Worker.
      // This is a simulation/fallback for active tabs.
      setTimeout(() => {
        new Notification('Flash10 复习时间到！', {
          body: `单词 "${word.word}" 需要复习了，点击开始速记。`,
          icon: '/favicon.ico'
        });
      }, delay);
    }
  }
};
