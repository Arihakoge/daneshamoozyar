import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight,
  Trophy, Star, Zap, AlertCircle, Play, RotateCcw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toPersianNumber } from "@/components/utils";

export default function TakeQuiz() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizState, setQuizState] = useState("loading"); // loading, ready, active, finished
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  const urlParams = new URLSearchParams(window.location.search);
  const stageId = urlParams.get("stageId");
  const pathId = urlParams.get("pathId");

  useEffect(() => {
    if (stageId) loadQuiz();
  }, [stageId]);

  const loadQuiz = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [stageData, quizData] = await Promise.all([
        base44.entities.PathStage.filter({ id: stageId }),
        base44.entities.Quiz.filter({ stage_id: stageId })
      ]);

      const loadedStage = stageData[0];
      setStage(loadedStage);

      if (quizData[0]) {
        const loadedQuiz = quizData[0];
        setQuiz(loadedQuiz);
        
        let parsedQuestions = loadedQuiz.questions;
        if (typeof parsedQuestions === "string") {
          parsedQuestions = JSON.parse(parsedQuestions);
        }
        
        if (loadedQuiz.shuffle_questions) {
          parsedQuestions = [...parsedQuestions].sort(() => Math.random() - 0.5);
        }
        
        setQuestions(parsedQuestions || []);
        
        if (loadedStage?.time_limit) {
          setTimeLeft(loadedStage.time_limit * 60);
        }
        
        setQuizState("ready");
      }
    } catch (error) {
      console.error("Error loading quiz:", error);
    }
    setLoading(false);
  };

  // Timer
  useEffect(() => {
    if (quizState !== "active" || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  const startQuiz = () => {
    setQuizState("active");
    setCurrentIndex(0);
    setAnswers({});
  };

  const selectAnswer = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const finishQuiz = useCallback(async () => {
    if (quizState === "finished") return;
    setQuizState("finished");

    // Calculate score
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= (stage?.passing_score || 60);
    const xpEarned = passed ? (stage?.xp_reward || 50) : Math.round((stage?.xp_reward || 50) * 0.3);
    const coinsEarned = passed ? (stage?.coins_reward || 10) : 0;

    setResults({
      score,
      correctCount,
      totalQuestions: questions.length,
      passed,
      xpEarned,
      coinsEarned
    });

    // Update progress
    try {
      const existingProgress = await base44.entities.StudentProgress.filter({
        student_id: user.id,
        stage_id: stageId
      });

      if (existingProgress.length > 0) {
        await base44.entities.StudentProgress.update(existingProgress[0].id, {
          status: passed ? "completed" : "failed",
          score,
          xp_earned: xpEarned,
          coins_earned: coinsEarned,
          completed_at: new Date().toISOString()
        });
      }

      // Unlock next stage if passed
      if (passed && pathId) {
        const allStages = await base44.entities.PathStage.filter({ path_id: pathId });
        const sortedStages = allStages.sort((a, b) => a.order - b.order);
        const currentStageIndex = sortedStages.findIndex(s => s.id === stageId);
        
        if (currentStageIndex < sortedStages.length - 1) {
          const nextStage = sortedStages[currentStageIndex + 1];
          const nextProgress = await base44.entities.StudentProgress.filter({
            student_id: user.id,
            stage_id: nextStage.id
          });

          if (nextProgress.length === 0) {
            await base44.entities.StudentProgress.create({
              student_id: user.id,
              path_id: pathId,
              stage_id: nextStage.id,
              status: "unlocked"
            });
          } else if (nextProgress[0].status === "locked") {
            await base44.entities.StudentProgress.update(nextProgress[0].id, {
              status: "unlocked"
            });
          }
        }

        // Update user coins
        if (coinsEarned > 0) {
          await base44.auth.updateMe({
            coins: (user.coins || 0) + coinsEarned
          });
        }
      }
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [questions, answers, stage, user, stageId, pathId, quizState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toPersianNumber(mins)}:${toPersianNumber(secs.toString().padStart(2, '0'))}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری آزمون...</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center clay-card p-8">
          <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">آزمونی یافت نشد</h2>
          <Button onClick={() => navigate(createPageUrl(`PathDetail?id=${pathId}`))}>
            بازگشت
          </Button>
        </div>
      </div>
    );
  }

  // Ready State
  if (quizState === "ready") {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="clay-card p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{stage?.title}</h1>
          <p className="text-gray-400 mb-6">{stage?.description}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="clay-card p-3 bg-blue-900/30">
              <p className="text-xl font-bold text-blue-400">{toPersianNumber(questions.length)}</p>
              <p className="text-xs text-gray-400">سوال</p>
            </div>
            {stage?.time_limit && (
              <div className="clay-card p-3 bg-orange-900/30">
                <p className="text-xl font-bold text-orange-400">{toPersianNumber(stage.time_limit)}</p>
                <p className="text-xs text-gray-400">دقیقه</p>
              </div>
            )}
            <div className="clay-card p-3 bg-green-900/30">
              <p className="text-xl font-bold text-green-400">{toPersianNumber(stage?.passing_score || 60)}%</p>
              <p className="text-xs text-gray-400">نمره قبولی</p>
            </div>
          </div>

          <div className="clay-card p-4 bg-yellow-900/30 mb-6 text-right">
            <h3 className="font-bold text-yellow-300 mb-2">پاداش‌ها:</h3>
            <div className="flex justify-around">
              <span className="text-yellow-400"><Zap className="w-4 h-4 inline ml-1" />{toPersianNumber(stage?.xp_reward || 50)} XP</span>
              <span className="text-amber-400">🪙 {toPersianNumber(stage?.coins_reward || 10)} سکه</span>
            </div>
          </div>

          <Button onClick={startQuiz} size="lg" className="bg-purple-600 hover:bg-purple-700 w-full">
            <Play className="w-5 h-5 ml-2" />
            شروع آزمون
          </Button>
        </motion.div>
      </div>
    );
  }

  // Finished State
  if (quizState === "finished" && results) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="clay-card p-8 text-center"
        >
          {results.passed ? (
            <>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-green-400 mb-2">🎉 آفرین!</h1>
              <p className="text-gray-300 mb-6">آزمون را با موفقیت پاس کردی!</p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-orange-400 mb-2">دوباره تلاش کن!</h1>
              <p className="text-gray-300 mb-6">نمره‌ات از حد نصاب کمتر بود</p>
            </>
          )}

          <div className="clay-card p-6 bg-gray-800/50 mb-6">
            <div className="text-5xl font-bold text-white mb-2">{toPersianNumber(results.score)}%</div>
            <p className="text-gray-400">
              {toPersianNumber(results.correctCount)} از {toPersianNumber(results.totalQuestions)} سوال صحیح
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="clay-card p-4 bg-yellow-900/30">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-400">+{toPersianNumber(results.xpEarned)}</p>
              <p className="text-xs text-gray-400">XP</p>
            </div>
            <div className="clay-card p-4 bg-amber-900/30">
              <span className="text-3xl">🪙</span>
              <p className="text-2xl font-bold text-amber-400">+{toPersianNumber(results.coinsEarned)}</p>
              <p className="text-xs text-gray-400">سکه</p>
            </div>
          </div>

          <div className="flex gap-3">
            {!results.passed && (
              <Button onClick={startQuiz} className="flex-1 bg-orange-600 hover:bg-orange-700">
                <RotateCcw className="w-4 h-4 ml-2" />
                تلاش مجدد
              </Button>
            )}
            <Button 
              onClick={() => navigate(createPageUrl(`PathDetail?id=${pathId}`))}
              className={`flex-1 ${results.passed ? "bg-purple-600 hover:bg-purple-700" : ""}`}
              variant={results.passed ? "default" : "outline"}
            >
              بازگشت به مسیر
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active Quiz State
  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="clay-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">
            سوال {toPersianNumber(currentIndex + 1)} از {toPersianNumber(questions.length)}
          </span>
          {timeLeft !== null && (
            <div className={`flex items-center gap-2 ${timeLeft < 60 ? "text-red-400" : "text-gray-300"}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
        >
          <Card className="clay-card mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">{currentQuestion.question}</h2>

              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(currentIndex, index)}
                    className={`w-full p-4 rounded-xl text-right transition-all ${
                      answers[currentIndex] === index
                        ? "bg-purple-600 text-white ring-2 ring-purple-400"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <span className="font-bold ml-2">
                      {["الف", "ب", "ج", "د"][index]})
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          onClick={() => setCurrentIndex(prev => prev - 1)}
          disabled={currentIndex === 0}
          variant="outline"
          className="clay-button"
        >
          <ChevronRight className="w-5 h-5" />
          قبلی
        </Button>

        <div className="flex-1" />

        {currentIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            بعدی
            <ChevronLeft className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            onClick={finishQuiz}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-5 h-5 ml-2" />
            پایان آزمون
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="clay-card p-4 mt-6">
        <p className="text-sm text-gray-400 mb-3">ناوبری سریع:</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-10 h-10 rounded-lg font-bold transition-all ${
                index === currentIndex
                  ? "bg-purple-600 text-white"
                  : answers[index] !== undefined
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-400 hover:bg-gray-600"
              }`}
            >
              {toPersianNumber(index + 1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}