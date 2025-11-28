import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Target, TrendingUp } from "lucide-react";
import { toPersianNumber } from "@/components/utils";

// تعریف شرایط و مراحل کسب هر نشان
const badgeRequirements = {
  first_submission: {
    steps: ["ورود به سامانه", "انتخاب یک تکلیف", "ارسال پاسخ"],
    requirement: { type: "submissions", target: 1 },
    tips: ["هر تکلیفی را می‌توانی ارسال کنی!", "حتی یک جمله هم کافیست"]
  },
  perfect_score: {
    steps: ["تکلیف را با دقت انجام بده", "قبل از ارسال چک کن", "منتظر نمره‌دهی باش"],
    requirement: { type: "perfect_scores", target: 1 },
    tips: ["سوالات را کامل بخوان", "از معلم سوال بپرس اگر نفهمیدی"]
  },
  streak_3: {
    steps: ["روز اول: یک تکلیف ارسال کن", "روز دوم: یک تکلیف ارسال کن", "روز سوم: یک تکلیف ارسال کن"],
    requirement: { type: "streak", target: 3 },
    tips: ["هر روز حداقل یک فعالیت داشته باش", "یادآور بگذار!"]
  },
  streak_7: {
    steps: ["۷ روز متوالی فعالیت داشته باش"],
    requirement: { type: "streak", target: 7 },
    tips: ["صبح‌ها تکالیف را چک کن", "برنامه‌ریزی کن"]
  },
  streak_30: {
    steps: ["۳۰ روز متوالی فعالیت داشته باش"],
    requirement: { type: "streak", target: 30 },
    tips: ["عادت روزانه بساز", "تقویم پیشرفتت را دنبال کن"]
  },
  champion: {
    steps: ["تکالیف را به موقع ارسال کن", "نمرات خوب بگیر", "فعالیت مداوم داشته باش"],
    requirement: { type: "coins", target: 1000 },
    tips: ["هر فعالیت سکه می‌دهد", "نمره ۲۰ سکه بیشتری می‌دهد"]
  },
  consistent: {
    steps: ["حداقل ۵ تکلیف ارسال کن", "میانگین نمره بالای ۱۵ داشته باش"],
    requirement: { type: "average_score", target: 15, minSubmissions: 5 },
    tips: ["کیفیت مهم‌تر از کمیت است", "از بازخورد معلم استفاده کن"]
  },
  early_bird: {
    steps: ["تکالیف را قبل از مهلت ارسال کن", "این کار را ۵ بار تکرار کن"],
    requirement: { type: "early_submissions", target: 5 },
    tips: ["همین که تکلیف اومد انجامش بده", "عقب نیفت!"]
  },
  math_master: {
    steps: ["در ریاضی تکلیف ارسال کن", "میانگین بالای ۱۸ بگیر"],
    requirement: { type: "subject_average", subject: "ریاضی", target: 18, minSubmissions: 3 },
    tips: ["تمرین بیشتر = نمره بهتر", "از یارا کمک بخواه"]
  },
  science_master: {
    steps: ["در علوم تکلیف ارسال کن", "میانگین بالای ۱۸ بگیر"],
    requirement: { type: "subject_average", subject: "علوم", target: 18, minSubmissions: 3 },
    tips: ["آزمایش‌ها را خوب یاد بگیر", "مفاهیم را درک کن"]
  },
  literature_master: {
    steps: ["در فارسی تکلیف ارسال کن", "میانگین بالای ۱۸ بگیر"],
    requirement: { type: "subject_average", subject: "فارسی", target: 18, minSubmissions: 3 },
    tips: ["کتاب بخوان", "نگارش تمرین کن"]
  },
  all_subjects: {
    steps: ["در همه دروس فعال باش", "در همه میانگین بالای ۱۵ داشته باش"],
    requirement: { type: "all_subjects_average", target: 15 },
    tips: ["همه دروس را جدی بگیر", "تعادل داشته باش"]
  },
  top_student: {
    steps: ["سکه جمع کن", "نمرات خوب بگیر", "در تابلوی امتیازات اول شو"],
    requirement: { type: "leaderboard_rank", target: 1 },
    tips: ["فعالیت مداوم داشته باش", "با دیگران رقابت کن"]
  },
  weekly_champion: {
    steps: ["یک هفته خیلی فعال باش", "رتبه اول هفته را بگیر"],
    requirement: { type: "weekly_rank", target: 1 },
    tips: ["هفته جدید = شروع تازه", "زودتر از بقیه شروع کن"]
  },
  monthly_champion: {
    steps: ["یک ماه کامل تلاش کن", "رتبه اول ماه را بگیر"],
    requirement: { type: "monthly_rank", target: 1 },
    tips: ["مداومت کلید موفقیته", "هر هفته پیشرفت کن"]
  },
  helper: {
    steps: ["به همکلاسی‌ها کمک کن", "سوالاتشان را جواب بده"],
    requirement: { type: "help_count", target: 5 },
    tips: ["کمک به دیگران = یادگیری بهتر", "مهربان باش"]
  },
  fast_learner: {
    steps: ["تکالیف را سریع ارسال کن", "منتظر مهلت نمان"],
    requirement: { type: "fast_submissions", target: 3 },
    tips: ["وقتی تکلیف می‌آد شروع کن", "معطل نکن"]
  },
  rising_star: {
    steps: ["نمراتت را بهتر کن", "پیشرفت نشان بده"],
    requirement: { type: "improvement", target: 2 },
    tips: ["از اشتباهات یاد بگیر", "هر بار بهتر شو"]
  }
};

// محاسبه پیشرفت برای هر نشان
export const calculateBadgeProgress = (badgeType, userStats) => {
  const req = badgeRequirements[badgeType];
  if (!req) return { progress: 0, current: 0, target: 1 };

  const { requirement } = req;
  let current = 0;
  let target = requirement.target || 1;

  switch (requirement.type) {
    case "submissions":
      current = userStats.totalSubmissions || 0;
      break;
    case "perfect_scores":
      current = userStats.perfectScores || 0;
      break;
    case "streak":
      current = userStats.currentStreak || 0;
      break;
    case "coins":
      current = userStats.coins || 0;
      break;
    case "average_score":
      current = userStats.averageScore || 0;
      break;
    case "early_submissions":
      current = userStats.earlySubmissions || 0;
      break;
    case "subject_average":
      const subjectData = userStats.subjectStats?.[requirement.subject];
      current = subjectData?.average || 0;
      break;
    case "all_subjects_average":
      const allAvg = userStats.subjectStats ? 
        Object.values(userStats.subjectStats).reduce((sum, s) => sum + (s.average || 0), 0) / 
        Math.max(Object.keys(userStats.subjectStats).length, 1) : 0;
      current = allAvg;
      break;
    case "leaderboard_rank":
    case "weekly_rank":
    case "monthly_rank":
      current = userStats.leaderboardRank === 1 ? 1 : 0;
      break;
    default:
      current = 0;
  }

  const progress = Math.min((current / target) * 100, 100);
  return { progress, current, target };
};

export default function BadgeDetailModal({ badge, userStats = {}, onClose }) {
  if (!badge || !badge.config) return null;

  const { type, config, earned } = badge;
  const requirements = badgeRequirements[type] || { steps: ["این نشان را کسب کن!"], tips: [] };
  const progressInfo = calculateBadgeProgress(type, userStats || {});
  const Icon = config?.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="clay-card p-6 max-w-md w-full my-8 relative"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 left-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* آیکون نشان */}
          <div className="text-center mb-6">
            <motion.div 
              className={`w-28 h-28 rounded-full bg-gradient-to-br ${config?.color || 'from-gray-400 to-gray-600'} p-1 shadow-2xl mx-auto mb-4 ${!earned ? 'opacity-50 grayscale' : ''}`}
              animate={earned ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
                {Icon && <Icon className="w-14 h-14 text-white" />}
              </div>
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-1">{config?.name || "نشان"}</h2>
            <p className="text-gray-400">{config?.description || ""}</p>
          </div>

          {/* نوار پیشرفت */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">پیشرفت</span>
              <span className={earned ? "text-green-400" : "text-purple-300"}>
                {earned ? "کامل شده! ✓" : `${toPersianNumber(Math.round(progressInfo.progress))}٪`}
              </span>
            </div>
            <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${earned ? 100 : progressInfo.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${earned ? 'bg-gradient-to-r from-green-400 to-green-600' : `bg-gradient-to-r ${config?.color || 'from-purple-400 to-purple-600'}`}`}
              />
            </div>
            {!earned && (
              <p className="text-xs text-gray-400 mt-1 text-center">
                {toPersianNumber(progressInfo.current)} از {toPersianNumber(progressInfo.target)}
              </p>
            )}
          </div>

          {/* مراحل کسب */}
          <div className="clay-card p-4 bg-purple-900/30 mb-4">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              مراحل کسب نشان
            </h4>
            <div className="space-y-2">
              {requirements.steps.map((step, i) => {
                const isCompleted = earned || (progressInfo.progress >= ((i + 1) / requirements.steps.length) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : toPersianNumber(i + 1)}
                    </div>
                    <span className={isCompleted ? 'text-green-300' : 'text-gray-300'}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* راهنما و نکات */}
          {!earned && requirements.tips && requirements.tips.length > 0 && (
            <div className="clay-card p-4 bg-yellow-900/30">
              <h4 className="font-bold text-yellow-300 mb-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                نکات مفید
              </h4>
              <ul className="space-y-1">
                {requirements.tips.map((tip, i) => (
                  <li key={i} className="text-yellow-200 text-sm flex items-start gap-2">
                    <span>💡</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* پیام موفقیت */}
          {earned && (
            <div className="clay-card p-4 bg-green-900/30 text-center">
              <p className="text-green-300 font-bold text-lg">🎉 تبریک! این نشان را کسب کردی!</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}