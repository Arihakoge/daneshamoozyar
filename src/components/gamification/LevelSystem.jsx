export const LEVEL_CONFIG = {
  baseXP: 100, // XP needed for level 2
  multiplier: 1.2, // Each level needs 20% more XP than previous
};

export function calculateLevel(totalXP) {
  let level = 1;
  let xpForNextLevel = LEVEL_CONFIG.baseXP;
  let xpRemaining = totalXP || 0;

  while (xpRemaining >= xpForNextLevel) {
    xpRemaining -= xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(xpForNextLevel * LEVEL_CONFIG.multiplier);
  }

  return {
    level,
    currentLevelXP: Math.floor(xpRemaining),
    nextLevelXP: xpForNextLevel,
    progress: Math.floor((xpRemaining / xpForNextLevel) * 100)
  };
}

export function getLevelTier(level) {
  if (level < 5) return { name: "تازه کار", color: "from-gray-400 to-gray-600" };
  if (level < 10) return { name: "مبتدی", color: "from-green-400 to-green-600" };
  if (level < 20) return { name: "کارآموز", color: "from-blue-400 to-blue-600" };
  if (level < 30) return { name: "دانش‌پژوه", color: "from-purple-400 to-purple-600" };
  if (level < 40) return { name: "محقق", color: "from-pink-400 to-pink-600" };
  if (level < 50) return { name: "متخصص", color: "from-orange-400 to-orange-600" };
  if (level < 75) return { name: "استاد", color: "from-red-400 to-red-600" };
  if (level < 100) return { name: "دانشمند", color: "from-cyan-400 to-cyan-600" };
  return { name: "افسانه", color: "from-yellow-400 to-amber-500" };
}

export function getLevelTitle(level) {
  return getLevelTier(level).name;
}