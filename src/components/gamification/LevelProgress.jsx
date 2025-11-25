import React from "react";
import { motion } from "framer-motion";
import { Star, Zap } from "lucide-react";
import { toPersianNumber } from "@/components/utils";

export default function LevelProgress({ level, coins, xpForNextLevel = 100 }) {
  const currentLevelXP = (level - 1) * xpForNextLevel;
  const xpInCurrentLevel = coins - currentLevelXP;
  const progress = Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100);
  const xpNeeded = Math.max(xpForNextLevel - xpInCurrentLevel, 0);

  return (
    <div className="clay-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">سطح {toPersianNumber(level)}</h3>
            <p className="text-sm text-gray-400">در مسیر پیشرفت</p>
          </div>
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2 text-yellow-400">
            <Zap className="w-5 h-5" />
            <span className="font-bold text-xl">{toPersianNumber(coins)}</span>
          </div>
          <p className="text-xs text-gray-400">سکه جمع شده</p>
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-400">سطح {toPersianNumber(level)}</span>
          <span className="text-purple-300">
            {toPersianNumber(xpNeeded)} سکه تا سطح {toPersianNumber(level + 1)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="clay-card p-3 text-center bg-purple-900/30">
          <p className="text-2xl font-bold text-purple-300">{toPersianNumber(level)}</p>
          <p className="text-xs text-gray-400">سطح فعلی</p>
        </div>
        <div className="clay-card p-3 text-center bg-yellow-900/30">
          <p className="text-2xl font-bold text-yellow-300">{toPersianNumber(coins)}</p>
          <p className="text-xs text-gray-400">کل سکه‌ها</p>
        </div>
        <div className="clay-card p-3 text-center bg-green-900/30">
          <p className="text-2xl font-bold text-green-300">{toPersianNumber(Math.round(progress))}%</p>
          <p className="text-xs text-gray-400">پیشرفت</p>
        </div>
      </div>
    </div>
  );
}