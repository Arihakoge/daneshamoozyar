import React from "react";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Zap, Target, Heart, Send, 
  Award, Crown, Gem, Flame 
} from "lucide-react";
import { toPersianDate } from "@/components/utils";

const BADGE_CONFIG = {
  top_student: {
    icon: Crown,
    title: "دانش‌آموز برتر",
    description: "کسب بالاترین نمره در کلاس",
    color: "from-yellow-400 to-orange-500",
    bgColor: "bg-yellow-500/20"
  },
  perfect_score: {
    icon: Star,
    title: "نمره کامل",
    description: "کسب نمره ۲۰ در یک تکلیف",
    color: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-500/20"
  },
  fast_learner: {
    icon: Zap,
    title: "یادگیرنده سریع",
    description: "ارسال تکلیف در کمتر از ۱ روز",
    color: "from-blue-400 to-cyan-500",
    bgColor: "bg-blue-500/20"
  },
  consistent: {
    icon: Target,
    title: "پایدار و مداوم",
    description: "ارسال ۵ تکلیف متوالی به موقع",
    color: "from-green-400 to-emerald-500",
    bgColor: "bg-green-500/20"
  },
  helper: {
    icon: Heart,
    title: "یاری‌دهنده",
    description: "کمک به هم‌کلاسی‌ها",
    color: "from-pink-400 to-rose-500",
    bgColor: "bg-pink-500/20"
  },
  first_submission: {
    icon: Send,
    title: "اولین قدم",
    description: "ارسال اولین تکلیف",
    color: "from-indigo-400 to-purple-500",
    bgColor: "bg-indigo-500/20"
  },
  ten_submissions: {
    icon: Award,
    title: "۱۰ تکلیف",
    description: "ارسال ۱۰ تکلیف موفق",
    color: "from-teal-400 to-green-500",
    bgColor: "bg-teal-500/20"
  },
  fifty_submissions: {
    icon: Trophy,
    title: "۵۰ تکلیف",
    description: "ارسال ۵۰ تکلیف موفق",
    color: "from-amber-400 to-yellow-500",
    bgColor: "bg-amber-500/20"
  },
  level_5: {
    icon: Gem,
    title: "سطح ۵",
    description: "رسیدن به سطح ۵",
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-500/20"
  },
  level_10: {
    icon: Crown,
    title: "سطح ۱۰",
    description: "رسیدن به سطح ۱۰",
    color: "from-rose-400 to-red-500",
    bgColor: "bg-rose-500/20"
  },
  coin_master: {
    icon: Flame,
    title: "سکه‌دار",
    description: "جمع‌آوری ۵۰۰ سکه",
    color: "from-orange-400 to-red-500",
    bgColor: "bg-orange-500/20"
  }
};

export default function BadgeCard({ badge, locked = false, size = "normal" }) {
  const config = BADGE_CONFIG[badge?.badge_type] || BADGE_CONFIG.first_submission;
  const Icon = config.icon;
  
  const sizeClasses = size === "small" 
    ? "w-16 h-16" 
    : "w-24 h-24";
  
  const iconSize = size === "small" ? "w-6 h-6" : "w-10 h-10";

  return (
    <motion.div
      whileHover={{ scale: locked ? 1 : 1.05 }}
      className={`relative flex flex-col items-center ${locked ? 'opacity-40 grayscale' : ''}`}
    >
      <div className={`${sizeClasses} rounded-full ${config.bgColor} flex items-center justify-center mb-2 relative`}>
        <div className={`absolute inset-1 rounded-full bg-gradient-to-br ${config.color} opacity-20`} />
        <Icon className={`${iconSize} text-white relative z-10`} />
        {!locked && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} opacity-30 blur-md`}
          />
        )}
      </div>
      <p className="text-sm font-bold text-white text-center">{config.title}</p>
      {size !== "small" && (
        <p className="text-xs text-gray-400 text-center mt-1">{config.description}</p>
      )}
      {badge?.earned_at && (
        <p className="text-xs text-gray-500 mt-1">{toPersianDate(badge.earned_at)}</p>
      )}
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </motion.div>
  );
}

export { BADGE_CONFIG };