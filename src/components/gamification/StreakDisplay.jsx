import React from "react";
import { Flame, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { toPersianNumber } from "@/components/utils";

export default function StreakDisplay({ currentStreak, longestStreak, weeklyActivity }) {
  const daysOfWeek = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  
  return (
    <div className="clay-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">فعالیت مستمر</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="clay-card p-4 bg-orange-900/30 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-4xl font-bold text-orange-400 mb-1"
          >
            {toPersianNumber(currentStreak)}
          </motion.div>
          <p className="text-sm text-orange-300">روز متوالی فعلی</p>
        </div>
        <div className="clay-card p-4 bg-purple-900/30 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="text-4xl font-bold text-purple-400 mb-1"
          >
            {toPersianNumber(longestStreak)}
          </motion.div>
          <p className="text-sm text-purple-300">بیشترین رکورد</p>
        </div>
      </div>

      {/* Weekly Activity Grid */}
      <div className="clay-card p-4 bg-gray-800/50">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">فعالیت این هفته</span>
        </div>
        <div className="flex justify-between gap-2">
          {daysOfWeek.map((day, index) => {
            const isActive = weeklyActivity && weeklyActivity[index];
            return (
              <motion.div
                key={day}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex-1 aspect-square rounded-lg flex flex-col items-center justify-center ${
                  isActive
                    ? "bg-gradient-to-br from-green-500 to-emerald-600"
                    : "bg-gray-700/50"
                }`}
              >
                <span className={`text-xs font-bold ${isActive ? "text-white" : "text-gray-500"}`}>
                  {day}
                </span>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-1"
                  >
                    ✓
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Streak Tips */}
      <div className="mt-4 p-3 rounded-lg bg-yellow-900/20 border border-yellow-600/30">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-300">
            {currentStreak >= 7
              ? "عالی! به فعالیت ادامه بده! 🔥"
              : currentStreak >= 3
              ? `${toPersianNumber(7 - currentStreak)} روز تا نشان هفته فعال!`
              : "هر روز فعالیت کن و نشان بگیر!"}
          </span>
        </div>
      </div>
    </div>
  );
}