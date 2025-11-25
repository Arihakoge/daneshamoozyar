import React from "react";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Zap, Target, Crown, Medal, 
  Flame, TrendingUp, Award, Heart 
} from "lucide-react";

const badgeConfigs = {
  top_student: {
    name: "دانش‌آموز برتر",
    icon: Crown,
    color: "from-yellow-400 to-yellow-600",
    description: "رتبه اول در تابلوی امتیازات"
  },
  perfect_score: {
    name: "نمره کامل",
    icon: Star,
    color: "from-purple-400 to-purple-600",
    description: "کسب نمره ۲۰ در یک تکلیف"
  },
  first_submission: {
    name: "اولین قدم",
    icon: Zap,
    color: "from-blue-400 to-blue-600",
    description: "ارسال اولین تکلیف"
  },
  streak_7: {
    name: "هفته فعال",
    icon: Flame,
    color: "from-orange-400 to-red-500",
    description: "۷ روز فعالیت متوالی"
  },
  streak_30: {
    name: "ماه درخشان",
    icon: Flame,
    color: "from-red-500 to-pink-600",
    description: "۳۰ روز فعالیت متوالی"
  },
  helper: {
    name: "یاریگر",
    icon: Heart,
    color: "from-pink-400 to-rose-500",
    description: "کمک به همکلاسی‌ها"
  },
  fast_learner: {
    name: "یادگیری سریع",
    icon: Zap,
    color: "from-cyan-400 to-blue-500",
    description: "ارسال زودهنگام تکالیف"
  },
  consistent: {
    name: "پایدار",
    icon: Target,
    color: "from-green-400 to-emerald-600",
    description: "میانگین بالای ۱۵ در تمام دروس"
  },
  rising_star: {
    name: "ستاره در حال طلوع",
    icon: TrendingUp,
    color: "from-indigo-400 to-purple-500",
    description: "بهبود چشمگیر در نمرات"
  },
  champion: {
    name: "قهرمان",
    icon: Trophy,
    color: "from-amber-400 to-yellow-500",
    description: "کسب ۱۰۰۰ سکه"
  }
};

export default function BadgeCard({ badgeType, earned = false, earnedAt, size = "medium" }) {
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
      className={`relative ${earned ? '' : 'opacity-40 grayscale'}`}
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