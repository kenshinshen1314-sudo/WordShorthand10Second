
import React, { useMemo } from 'react';
import { WordData, REVIEW_INTERVALS } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ReviewService } from '../reviewService';

interface SummaryViewProps {
  score: number;
  total: number;
  mastered: WordData[];
  onRestart: () => void;
  onHome: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ score, total, mastered, onRestart, onHome }) => {
  const queue = ReviewService.getQueue();
  
  // Calculate Statistics
  const stats = useMemo(() => {
    const totalInBank = queue.length;
    const stageCounts = [0, 0, 0, 0, 0]; // Index maps to stage
    queue.forEach(item => {
      if (item.stage < stageCounts.length) {
        stageCounts[item.stage]++;
      }
    });

    const avgStage = totalInBank > 0 
      ? (queue.reduce((acc, item) => acc + item.stage, 0) / totalInBank).toFixed(1)
      : 0;

    const distributionData = [
      { name: '1h', count: stageCounts[1], label: '初步' },
      { name: '1d', count: stageCounts[2], label: '巩固' },
      { name: '3d', count: stageCounts[3], label: '深化' },
      { name: '7d', count: stageCounts[4], label: '掌握' },
    ];

    return { totalInBank, avgStage, distributionData };
  }, [queue]);

  const pieData = [
    { name: '本次掌握', value: score },
    { name: '仍需练习', value: total - score },
  ];
  const COLORS = ['#6366f1', '#e2e8f0'];

  const getEncouragement = () => {
    const ratio = score / total;
    if (ratio === 1) return "完美无瑕！你是词霸本霸。";
    if (ratio >= 0.8) return "太棒了！你的专注力非常惊人。";
    if (ratio >= 0.5) return "还不错，保持节奏，再来一次！";
    return "没关系，10秒确实很快，多加练习。";
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom duration-500 pb-12">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">速记总结</h2>
          <p className="text-gray-500">{getEncouragement()}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Main Score Pie */}
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-indigo-600">{Math.round((score/total)*100)}%</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">掌握率</span>
            </div>
          </div>

          {/* Detailed Counts */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="text-2xl font-bold text-indigo-600">{score}</div>
                <div className="text-xs text-indigo-800 font-bold">本次成功</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-2xl font-bold text-slate-400">{total - score}</div>
                <div className="text-xs text-slate-500 font-bold">下次再战</div>
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white text-left shadow-lg shadow-indigo-100">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">记忆银行总量</div>
                  <div className="text-3xl font-black">{stats.totalInBank} 词</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">平均强度</div>
                  <div className="text-xl font-bold">Lv.{stats.avgStage}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Retention Stats */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between px-2">
             <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wider">艾宾浩斯分布统计</h4>
             <span className="text-xs text-indigo-500 font-medium">Spaced Repetition Stats</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.distributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar 
                  dataKey="count" 
                  fill="#6366f1" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stats.distributionData.map((d, i) => (
              <div key={i} className="text-center">
                <div className="text-xs font-bold text-gray-400">{d.label}</div>
                <div className="text-sm font-bold text-gray-800">{d.count}</div>
              </div>
            ))}
          </div>
        </div>

        {mastered.length > 0 && (
          <div className="text-left space-y-3">
            <h4 className="font-bold text-gray-700 text-sm px-2 uppercase tracking-wider">词库新成员:</h4>
            <div className="flex flex-wrap gap-2">
              {mastered.map((w, i) => (
                <span key={i} className="px-3 py-1 bg-white text-indigo-600 rounded-full text-sm font-medium border border-indigo-100 shadow-sm">
                  {w.word}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <span>再战 5 词</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          </button>
          <button
            onClick={onHome}
            className="w-full py-4 bg-white text-gray-500 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all"
          >
            回到主页
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryView;
