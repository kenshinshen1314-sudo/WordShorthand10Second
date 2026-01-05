
import React, { useState, useEffect } from 'react';
import { AppState, WordData, Category, ReviewItem } from './types';
import { fetchWordBatch } from './geminiService';
import { ReviewService } from './reviewService';
import Header from './components/Header';
import HomeView from './components/HomeView';
import LoadingView from './components/LoadingView';
import FlashcardView from './components/FlashcardView';
import SummaryView from './components/SummaryView';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [category, setCategory] = useState<Category>('General');
  const [words, setWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [masteredWords, setMasteredWords] = useState<WordData[]>([]);
  const [dueCount, setDueCount] = useState(0);
  // Track if the current session is a review session to handle restarts correctly
  const [isReviewSession, setIsReviewSession] = useState(false);

  useEffect(() => {
    ReviewService.requestPermission();
    const updateDueCount = () => {
      setDueCount(ReviewService.getDueItems().length);
    };
    updateDueCount();
    const interval = setInterval(updateDueCount, 60000); // Update count every minute
    return () => clearInterval(interval);
  }, []);

  const startSession = async (cat: Category) => {
    setCategory(cat);
    setIsReviewSession(false);
    setState(AppState.LOADING);
    try {
      const data = await fetchWordBatch(cat, 5);
      setWords(data);
      setCurrentIndex(0);
      setScore(0);
      setMasteredWords([]);
      setState(AppState.LEARNING);
    } catch (error) {
      console.error(error);
      alert("Failed to load words. Please try again.");
      setState(AppState.HOME);
    }
  };

  const startReviewSession = () => {
    const dueItems = ReviewService.getDueItems();
    if (dueItems.length === 0) return;
    
    setWords(dueItems.map(item => item.wordData));
    setCurrentIndex(0);
    setScore(0);
    setMasteredWords([]);
    setIsReviewSession(true);
    setState(AppState.REVIEWING);
  };

  const handleNext = (mastered: boolean) => {
    const currentWord = words[currentIndex];
    if (mastered) {
      setScore(prev => prev + 1);
      setMasteredWords(prev => [...prev, currentWord]);
      ReviewService.saveToQueue(currentWord);
    } else if (state === AppState.REVIEWING) {
      // If review fails, reset to Stage 1
      ReviewService.removeFromQueue(currentWord.word);
      ReviewService.saveToQueue(currentWord);
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setState(AppState.SUMMARY);
    }
  };

  const resetToHome = () => {
    setState(AppState.HOME);
    setWords([]);
    setDueCount(ReviewService.getDueItems().length);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <Header />
      <main className="w-full max-w-2xl px-4 py-8 flex-grow flex flex-col items-center justify-center">
        {state === AppState.HOME && (
          <HomeView 
            onStart={startSession} 
            onReview={startReviewSession}
            dueCount={dueCount}
          />
        )}
        {state === AppState.LOADING && <LoadingView />}
        {(state === AppState.LEARNING || state === AppState.REVIEWING) && words.length > 0 && (
          <FlashcardView 
            word={words[currentIndex]} 
            index={currentIndex} 
            total={words.length} 
            onComplete={handleNext} 
            isReview={state === AppState.REVIEWING}
          />
        )}
        {state === AppState.SUMMARY && (
          <SummaryView 
            score={score} 
            total={words.length} 
            mastered={masteredWords} 
            // Fix: Use the tracked isReviewSession boolean because state is narrowed to SUMMARY here,
            // which caused the previous state === AppState.REVIEWING comparison to be unreachable.
            onRestart={() => isReviewSession ? startReviewSession() : startSession(category)} 
            onHome={resetToHome}
          />
        )}
      </main>
      
      <footer className="w-full p-4 text-center text-gray-400 text-sm">
        Flash10 © 2024 • Powered by Gemini AI
      </footer>
    </div>
  );
};

export default App;
