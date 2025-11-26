import React, { useState } from "react";
import { Trophy, Calendar, TrendingUp, Medal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianNumber } from "@/components/utils";

const tabs = [
  { id: "weekly", label: "هفتگی", icon: Calendar },
  { id: "monthly", label: "ماهانه", icon: Calendar },
  { id: "all", label: "کل", icon: Trophy }
];

function getRankIcon(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return toPersianNumber(rank);
}

function getRankBg(rank) {
  if (rank === 1) return "bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border-yellow-500/50";
  if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50";
  if (rank === 3) return "bg-gradient-to-r from-orange-700/30 to-amber-700/30 border-orange-600/50";
  return "bg-gray-800/30 border-gray-700/30";
}

export default function LeaderboardTabs({ students, currentUserId }) {
  const [activeTab, setActiveTab] = useState("weekly");

  const getFilteredStudents = () => {
    const now = new Date();
    let filteredStudents = students.map(student => {
      let relevantSubmissions = student.submissions || [];
      
      if (activeTab === "weekly") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        relevantSubmissions = relevantSubmissions.filter(s => new Date(s.created_date) >= weekAgo);
      } else if (activeTab === "monthly") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        relevantSubmissions = relevantSubmissions.filter(s => new Date(s.created_date) >= monthAgo);
      }

      const gradedSubs = relevantSubmissions.filter(s => s.score !== null);
      const totalScore = gradedSubs.reduce((sum, s) => sum + (s.score || 0), 0);
      const avgScore = gradedSubs.length > 0 ? totalScore / gradedSubs.length : 0;
      const periodCoins = relevantSubmissions.length * 10; // Simple calculation

      return {
        ...student,
        periodScore: totalScore,
        periodAvg: avgScore,
        periodSubmissions: relevantSubmissions.length,
        periodCoins
      };
    });

    return filteredStudents
      .filter(s => s.periodSubmissions > 0)
      .sort((a, b) => b.periodScore - a.periodScore || b.periodAvg - a.periodAvg);
  };

  const rankedStudents = getFilteredStudents();

  return (
    <div className="clay-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">تابلوی رتبه‌بندی</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 clay-card bg-gray-800/50 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id
                ? "bg-purple-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-2"
        >
          {rankedStudents.length > 0 ? (
            rankedStudents.slice(0, 10).map((student, index) => {
              const rank = index + 1;
              const isCurrentUser = student.id === currentUserId;

              return (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-xl border ${getRankBg(rank)} ${
                    isCurrentUser ? "ring-2 ring-purple-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-10 text-center">
                      {getRankIcon(rank)}
                    </div>
                    
                    {student.profile_image_url ? (
                      <img
                        src={student.profile_image_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: student.avatar_color || "#8B5CF6" }}
                      >
                        {(student.display_name || student.full_name || "?").charAt(0)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isCurrentUser ? "text-purple-300" : "text-white"}`}>
                        {student.full_name || student.display_name || "کاربر"}
                        {isCurrentUser && " (شما)"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {toPersianNumber(student.periodSubmissions)} تکلیف
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="font-bold text-yellow-400">
                        {toPersianNumber(Math.round(student.periodAvg * 10) / 10)}
                      </p>
                      <p className="text-xs text-gray-500">میانگین</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Medal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>هنوز داده‌ای برای این دوره وجود ندارد</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}