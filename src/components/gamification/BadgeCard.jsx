import React from "react";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Zap, Target, Crown, Medal, 
  Flame, TrendingUp, Award, Heart, Users 
} from "lucide-react";

const badgeConfigs = {
  top_student: {
    name: "دانش‌آموز برتر",
    icon: Crown,
    color: "from-yellow-400 to-yellow-600",
    description: "رتبه اول در تابلوی امتیازات",
    howToGet: "در تابلوی امتیازات رتبه اول شو!"
  },
  perfect_score: {
    name: "نمره کامل",
    icon: Star,
    color: "from-purple-400 to-purple-600",
    description: "کسب نمره ۲۰ در یک تکلیف",
    howToGet: "در یک تکلیف نمره ۲۰ کامل بگیر!"
  },
  first_submission: {
    name: "اولین قدم",
    icon: Zap,
    color: "from-blue-400 to-blue-600",
    description: "ارسال اولین تکلیف",
    howToGet: "اولین تکلیف خود را ارسال کن!"
  },
  streak_3: {
    name: "شروع خوب",
    icon: Flame,
    color: "from-yellow-400 to-orange-400",
    description: "۳ روز فعالیت متوالی",
    howToGet: "۳ روز پشت سر هم تکلیف ارسال کن!"
  },
  streak_7: {
    name: "هفته فعال",
    icon: Flame,
    color: "from-orange-400 to-red-500",
    description: "۷ روز فعالیت متوالی",
    howToGet: "یک هفته کامل هر روز فعالیت داشته باش!"
  },
  streak_30: {
    name: "ماه درخشان",
    icon: Flame,
    color: "from-red-500 to-pink-600",
    description: "۳۰ روز فعالیت متوالی",
    howToGet: "یک ماه کامل هر روز فعالیت داشته باش!"
  },
  helper: {
    name: "یاریگر",
    icon: Heart,
    color: "from-pink-400 to-rose-500",
    description: "کمک به همکلاسی‌ها",
    howToGet: "به ۵ همکلاسی در حل تکالیف کمک کن!"
  },
  fast_learner: {
    name: "یادگیری سریع",
    icon: Zap,
    color: "from-cyan-400 to-blue-500",
    description: "ارسال زودهنگام تکالیف",
    howToGet: "تکالیف را قبل از مهلت ارسال کن!"
  },
  early_bird: {
    name: "سحرخیز",
    icon: Zap,
    color: "from-amber-400 to-orange-500",
    description: "۵ تکلیف زودتر از مهلت",
    howToGet: "۵ تکلیف را قبل از مهلت ارسال کن!"
  },
  consistent: {
    name: "پایدار",
    icon: Target,
    color: "from-green-400 to-emerald-600",
    description: "میانگین بالای ۱۵ در تمام دروس",
    howToGet: "میانگین نمراتت را بالای ۱۵ نگه دار!"
  },
  rising_star: {
    name: "ستاره در حال طلوع",
    icon: TrendingUp,
    color: "from-indigo-400 to-purple-500",
    description: "بهبود چشمگیر در نمرات",
    howToGet: "نمراتت را نسبت به هفته قبل بهتر کن!"
  },
  champion: {
    name: "قهرمان",
    icon: Trophy,
    color: "from-amber-400 to-yellow-500",
    description: "کسب ۱۰۰۰ سکه",
    howToGet: "۱۰۰۰ سکه جمع کن!"
  },
  math_master: {
    name: "استاد ریاضی",
    icon: Medal,
    color: "from-blue-500 to-indigo-600",
    description: "میانگین بالای ۱۸ در ریاضی",
    howToGet: "در درس ریاضی میانگین بالای ۱۸ بگیر!"
  },
  science_master: {
    name: "استاد علوم",
    icon: Medal,
    color: "from-green-500 to-emerald-600",
    description: "میانگین بالای ۱۸ در علوم",
    howToGet: "در درس علوم میانگین بالای ۱۸ بگیر!"
  },
  literature_master: {
    name: "استاد فارسی",
    icon: Medal,
    color: "from-rose-500 to-pink-600",
    description: "میانگین بالای ۱۸ در فارسی",
    howToGet: "در درس فارسی میانگین بالای ۱۸ بگیر!"
  },
  weekly_champion: {
    name: "قهرمان هفته",
    icon: Trophy,
    color: "from-cyan-400 to-blue-500",
    description: "رتبه اول هفته",
    howToGet: "در تابلوی هفتگی رتبه اول شو!"
  },
  monthly_champion: {
    name: "قهرمان ماه",
    icon: Crown,
    color: "from-purple-500 to-violet-600",
    description: "رتبه اول ماه",
    howToGet: "در تابلوی ماهانه رتبه اول شو!"
  },
  all_subjects: {
    name: "همه‌فن‌حریف",
    icon: Star,
    color: "from-violet-400 to-fuchsia-500",
    description: "نمره بالای ۱۵ در همه دروس",
    howToGet: "در همه دروس میانگین بالای ۱۵ بگیر!"
  },
  team_player: {
    name: "بازیکن تیمی",
    icon: Users, // Users is not imported in BadgeCard.js yet
    color: "from-cyan-400 to-blue-500",
    description: "همکاری موثر با کلاس",
    howToGet: "در فعالیت‌های کلاسی مشارکت کن!"
  },
  class_champion: {
    name: "قهرمان کلاس",
    icon: Crown,
    color: "from-rose-400 to-pink-500",
    description: "بهترین عملکرد کلاسی",
    howToGet: "بیشترین امتیاز را در کلاس کسب کن!"
  },
  quiz_master: {
    name: "استاد آزمون",
    icon: Zap,
    color: "from-indigo-500 to-purple-600",
    description: "عملکرد عالی در آزمون‌ها",
    howToGet: "در ۳ آزمون نمره کامل بگیر!"
  },
  social_butterfly: {
    name: "فعال اجتماعی",
    icon: Users,
    color: "from-pink-400 to-rose-500",
    description: "فعالیت بالا در گروه‌ها",
    howToGet: "در بحث‌های کلاسی مشارکت فعال داشته باش!"
  }
};

export default function BadgeCard({ badgeType, earned = false, earnedAt, size = "medium", onClick }) {
  const config = badgeConfigs[badgeType];
  if (!config) return null;

  const Icon = config.icon;
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32"
  };

  const iconSizes = {
    small: "w-6 h-6",
    medium: "w-10 h-10",
    large: "w-14 h-14"
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onClick && onClick(badgeType, config)}
      className={`relative cursor-pointer ${earned ? '' : 'opacity-40 grayscale'}`}
    >
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.color} p-1 shadow-lg`}>
        <div className="w-full h-full rounded-full bg-gray-900/80 flex items-center justify-center">
          <Icon className={`${iconSizes[size]} text-white`} />
        </div>
      </div>
      {earned && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
        >
          <span className="text-white text-xs">✓</span>
        </motion.div>
      )}
      <div className="text-center mt-2">
        <p className={`font-bold text-white ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
          {config.name}
        </p>
        {size !== 'small' && (
          <p className="text-xs text-gray-400 mt-1">{config.description}</p>
        )}
      </div>
    </motion.div>
  );
}

export { badgeConfigs };