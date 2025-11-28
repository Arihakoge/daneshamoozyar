import React from "react";
import { motion } from "framer-motion";
import { 
  Star, Crown, Shield, Rocket, Gem, Sparkles, 
  Zap, Award, Trophy, Medal, Target, Flame
} from "lucide-react";
import { toPersianNumber } from "@/components/utils";

// سیستم لول با ۱۰۰ سطح و قابلیت‌های مختلف
const levelTiers = [
  { min: 1, max: 10, name: "تازه‌کار", color: "from-gray-400 to-gray-600", icon: Star, perks: ["دسترسی به تابلوی امتیازات"] },
  { min: 11, max: 20, name: "مبتدی", color: "from-green-400 to-green-600", icon: Target, perks: ["آواتار سبز", "نشان مبتدی"] },
  { min: 21, max: 30, name: "یادگیرنده", color: "from-blue-400 to-blue-600", icon: Zap, perks: ["آواتار آبی", "۱۰٪ سکه بیشتر"] },
  { min: 31, max: 40, name: "پیشرفته", color: "from-purple-400 to-purple-600", icon: Flame, perks: ["آواتار بنفش", "۱۵٪ سکه بیشتر"] },
  { min: 41, max: 50, name: "حرفه‌ای", color: "from-pink-400 to-pink-600", icon: Award, perks: ["آواتار صورتی", "۲۰٪ سکه بیشتر", "فریم ویژه"] },
  { min: 51, max: 60, name: "استاد", color: "from-orange-400 to-orange-600", icon: Medal, perks: ["آواتار نارنجی", "۲۵٪ سکه بیشتر", "نشان استادی"] },
  { min: 61, max: 70, name: "نخبه", color: "from-red-400 to-red-600", icon: Shield, perks: ["آواتار قرمز", "۳۰٪ سکه بیشتر", "فریم طلایی"] },
  { min: 71, max: 80, name: "قهرمان", color: "from-yellow-400 to-yellow-600", icon: Trophy, perks: ["آواتار طلایی", "۴۰٪ سکه بیشتر", "تاج برنزی"] },
  { min: 81, max: 90, name: "افسانه‌ای", color: "from-cyan-400 to-cyan-600", icon: Gem, perks: ["آواتار فیروزه‌ای", "۵۰٪ سکه بیشتر", "تاج نقره‌ای"] },
  { min: 91, max: 100, name: "اسطوره", color: "from-amber-300 via-yellow-400 to-amber-500", icon: Crown, perks: ["آواتار رنگین‌کمانی", "۱۰۰٪ سکه بیشتر", "تاج طلایی", "نشان VIP"] },
];

// محاسبه XP مورد نیاز برای هر لول
export const getXPForLevel = (level) => {
  // فرمول پیشرونده: هر لول سخت‌تر می‌شود
  return Math.floor(50 * Math.pow(1.15, level - 1));
};

// محاسبه کل XP مورد نیاز تا یک لول خاص
export const getTotalXPForLevel = (level) => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

// محاسبه لول بر اساس سکه‌ها
export const calculateLevel = (coins) => {
  let level = 1;
  let totalXP = 0;
  
  while (level < 100 && totalXP + getXPForLevel(level) <= coins) {
    totalXP += getXPForLevel(level);
    level++;
  }
  
  return {
    level,
    currentXP: coins - totalXP,
    xpForNextLevel: getXPForLevel(level),
    totalXP: coins,
    progress: Math.min(((coins - totalXP) / getXPForLevel(level)) * 100, 100)
  };
};

// دریافت اطلاعات رده لول
export const getLevelTier = (level) => {
  return levelTiers.find(tier => level >= tier.min && level <= tier.max) || levelTiers[0];
};

// کامپوننت نمایش لول پیشرفته
export default function LevelSystem({ coins = 0, showDetails = true }) {
  const levelInfo = calculateLevel(coins);
  const tier = getLevelTier(levelInfo.level);
  const Icon = tier.icon;
  
  const nextTier = levelTiers.find(t => t.min > levelInfo.level);
  const levelsToNextTier = nextTier ? nextTier.min - levelInfo.level : 0;

  return (
    <div className="clay-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div 
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${tier.color} p-1 shadow-lg`}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
              <Icon className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <div>
            <h3 className="text-2xl font-bold text-white">سطح {toPersianNumber(levelInfo.level)}</h3>
            <p className={`text-transparent bg-clip-text bg-gradient-to-r ${tier.color} font-bold`}>
              {tier.name}
            </p>
          </div>
        </div>
        
        <div className="text-left">
          <div className="flex items-center gap-2 text-yellow-400">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold text-2xl">{toPersianNumber(coins)}</span>
          </div>
          <p className="text-xs text-gray-400">سکه کل</p>
        </div>
      </div>

      {/* نوار پیشرفت */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">پیشرفت به سطح بعدی</span>
          <span className="text-purple-300">
            {toPersianNumber(levelInfo.currentXP)} / {toPersianNumber(levelInfo.xpForNextLevel)}
          </span>
        </div>
        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${tier.color} rounded-full relative`}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </motion.div>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          {toPersianNumber(levelInfo.xpForNextLevel - levelInfo.currentXP)} سکه تا سطح {toPersianNumber(levelInfo.level + 1)}
        </p>
      </div>

      {showDetails && (
        <>
          {/* قابلیت‌های فعلی */}
          <div className="clay-card p-4 bg-purple-900/30 mb-4">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              قابلیت‌های فعال شما
            </h4>
            <div className="flex flex-wrap gap-2">
              {tier.perks.map((perk, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 text-sm">
                  ✨ {perk}
                </span>
              ))}
            </div>
          </div>

          {/* رده بعدی */}
          {nextTier && (
            <div className="clay-card p-4 bg-gray-800/50">
              <h4 className="font-bold text-gray-300 mb-2 flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-400" />
                رده بعدی: {nextTier.name}
              </h4>
              <p className="text-sm text-gray-400 mb-2">
                {toPersianNumber(levelsToNextTier)} سطح تا رسیدن به رده «{nextTier.name}»
              </p>
              <div className="flex flex-wrap gap-2">
                {nextTier.perks.map((perk, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-gray-700/50 text-gray-400 text-sm">
                    🔒 {perk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { levelTiers };