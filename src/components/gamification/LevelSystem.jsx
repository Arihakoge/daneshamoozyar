export const LEVEL_CONFIG = {
  baseXP: 50,
  multiplier: 1.15,
};

export const LEVEL_TIERS = [
  { min: 1, max: 10, name: "تازه‌کار", color: "from-gray-400 to-gray-600" },
  { min: 11, max: 20, name: "مبتدی", color: "from-green-400 to-green-600" },
  { min: 21, max: 30, name: "یادگیرنده", color: "from-blue-400 to-blue-600" },
  { min: 31, max: 40, name: "پیشرفته", color: "from-purple-400 to-purple-600" },
  { min: 41, max: 50, name: "حرفه‌ای", color: "from-pink-400 to-pink-600" },
  { min: 51, max: 60, name: "استاد", color: "from-orange-400 to-orange-600" },
  { min: 61, max: 70, name: "نخبه", color: "from-red-400 to-red-600" },
  { min: 71, max: 80, name: "قهرمان", color: "from-yellow-400 to-yellow-600" },
  { min: 81, max: 90, name: "افسانه‌ای", color: "from-cyan-400 to-cyan-600" },
  { min: 91, max: 100, name: "اسطوره", color: "from-amber-300 via-yellow-400 to-amber-500" }
];

export function calculateLevel(coins) {
  const safeCoins = coins || 0;
  let level = 1;
  let totalXP = 0;
  
  // Cap at level 100
  while (level < 100) {
    const xpNeeded = Math.floor(LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.multiplier, level - 1));
    if (totalXP + xpNeeded > safeCoins) break;
    totalXP += xpNeeded;
    level++;
  }
  
  const xpForNext = Math.floor(LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.multiplier, level - 1));
  const currentXP = safeCoins - totalXP;
  const progress = xpForNext > 0 ? Math.min((currentXP / xpForNext) * 100, 100) : 0;
  
  const tier = LEVEL_TIERS.find(t => level >= t.min && level <= t.max) || LEVEL_TIERS[0];
  
  return { 
    level, 
    currentXP, 
    xpForNext, 
    progress, 
    tier 
  };
}

export function getLevelTier(level) {
    return LEVEL_TIERS.find(t => level >= t.min && level <= t.max) || LEVEL_TIERS[0];
}

export function getLevelTitle(level) {
  return getLevelTier(level).name;
}