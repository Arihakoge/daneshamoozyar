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

export function getLevelTitle(level) {
  if (level < 5) return "تازه کار";
  if (level < 10) return "مبتدی";
  if (level < 20) return "کارآموز";
  if (level < 30) return "دانش‌پژوه";
  if (level < 40) return "محقق";
  if (level < 50) return "متخصص";
  if (level < 75) return "استاد";
  if (level < 100) return "دانشمند";
  return "افسانه";
}