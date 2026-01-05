
import React, { useState, useEffect } from 'react';

const messages = [
  "正在用 AI 筛选高频词汇...",
  "正在为您构建科学记忆模型...",
  "AI 正在生成专属联想记忆法...",
  "正在绘制视觉辅助图像...",
  "准备进入 10s 极限模式..."
];

const LoadingView: React.FC = () => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🧠</span>
        </div>
      </div>
      <div className="space-y-2 text-center">
        <p className="text-xl font-medium text-gray-800 animate-pulse">{messages[msgIdx]}</p>
        <p className="text-sm text-gray-400">平均耗时 3-5 秒</p>
      </div>
    </div>
  );
};

export default LoadingView;
