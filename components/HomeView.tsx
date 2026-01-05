
import React from 'react';
import { Category } from '../types';

interface HomeViewProps {
  onStart: (category: Category) => void;
  onReview: () => void;
  dueCount: number;
}

const categories: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'General', label: '日常口语', icon: '🗣️', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'TOEFL', label: '托福高频', icon: '🎓', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'IELTS', label: '雅思词库', icon: '📝', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'GRE', label: 'GRE学术', icon: '🔍', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'SAT', label: 'SAT突破', icon: '🌟', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

const HomeView: React.FC<HomeViewProps> = ({ onStart, onReview, dueCount }) => {
  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500 w-full">
      <div className="space-y-4">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          10秒单词挑战
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          专注力极限挑战。配合艾宾浩斯记忆曲线，科学复习，持久记忆。
        </p>
      </div>

      {dueCount > 0 && (
        <div className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-bounce-subtle">
          <div className="text-left flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v5l3 3"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">复习时刻！</h3>
              <p className="text-white/80 text-sm">你有 {dueCount} 个单词已进入遗忘临界点</p>
            </div>
          </div>
          <button 
            onClick={onReview}
            className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-lg"
          >
            立即复习
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onStart(cat.id)}
            className={`flex items-center p-6 border-2 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] ${cat.color} group shadow-sm`}
          >
            <span className="text-3xl mr-4 group-hover:scale-125 transition-transform">{cat.icon}</span>
            <div className="text-left">
              <h3 className="font-bold text-lg">{cat.label}</h3>
              <p className="text-sm opacity-80">点击开始 5 词速记</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-3 text-left">
        <div className="bg-indigo-600 text-white p-1 rounded-full mt-1">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
        </div>
        <div>
          <h4 className="font-semibold text-indigo-900">艾宾浩斯复习法</h4>
          <p className="text-sm text-indigo-700">掌握单词后，系统将在 1小时、1天、3天、7天 后自动提醒您复习，直到形成长期记忆。</p>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
