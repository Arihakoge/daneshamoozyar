import React from "react";
import { motion } from "framer-motion";
import { Star, Zap } from "lucide-react";
import { toPersianNumber } from "@/components/utils";

export default function LevelProgress({ currentLevel, coins, xp }) {
  const baseXPPerLevel = 100;
  const xpForCurrentLevelStart = (currentLevel - 1) * baseXPPerLevel;
  const xpEarned = (coins || 0) - xpForCurrentLevelStart;
  const xpNeeded = baseXPPerLevel;
  const progress = Math.min((xpEarned / xpNeeded) * 100, 100);

  const levelColors = [
    "from-gray-400 to-gray-500",
    "from-green-400 to-emerald-500",
    "from-blue-400 to-cyan-500",
    "from-purple-400 to-violet-500",
    "from-pink-400 to-rose-500",
    "from-yellow-400 to-orange-500",
    "from-red-400 to-pink-500",
    "from-indigo-400 to-purple-500",
    "from-teal-400 to-cyan-500",
    "from-amber-400 to-yellow-500",
  ];

  const colorIndex = Math.min(currentLevel - 1, levelColors.length - 1);
  const currentColor = levelColors[colorIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="clay-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${currentColor} flex items-center justify-center shadow-lg`}>
            <span className="text-2xl font-bold text-white">{toPersianNumber(currentLevel)}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">سطح {toPersianNumber(currentLevel)}</h3>
            <p className="text-sm text-gray-400">
              {toPersianNumber(Math.max(0, xpNeeded - xpEarned))} سکه تا سطح بعدی
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 clay-card px-4 py-2 bg-yellow-500/20">
          <span className="text-2xl">🪙</span>
          <span className="text-xl font-bold text-yellow-400">{toPersianNumber(coins || 0)}</span>
        </div>
      </div>

      <div className="relative">
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${currentColor} rounded-full relative`}
          >
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 bg-white/20 rounded-full"
            />
          </motion.div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>سطح {toPersianNumber(currentLevel)}</span>
          <span>{toPersianNumber(Math.round(progress))}%</span>
          <span>سطح {toPersianNumber(currentLevel + 1)}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center clay-card p-3 bg-purple-500/10">
          <Star className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{toPersianNumber(currentLevel)}</p>
          <p className="text-xs text-gray-400">سطح</p>
        </div>
        <div className="text-center clay-card p-3 bg-yellow-500/10">
          <span className="text-xl">🪙</span>
          <p className="text-lg font-bold text-white">{toPersianNumber(coins || 0)}</p>
          <p className="text-xs text-gray-400">سکه</p>
        </div>
        <div className="text-center clay-card p-3 bg-blue-500/10">
          <Zap className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{toPersianNumber(xp || 0)}</p>
          <p className="text-xs text-gray-400">XP</p>
        </div>
      </div>
    </motion.div>
  );
}