import React from "react";
import { motion } from "framer-motion";
import { Crown, Medal, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toPersianNumber } from "@/components/utils";

export default function LeaderboardCard({ students, currentUserId, title = "جدول رتبه‌بندی" }) {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-400 font-bold">{toPersianNumber(rank)}</span>;
  };

  const getRankBg = (rank) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/30 to-orange-500/20 border-yellow-500/50";
    if (rank === 2) return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/50";
    if (rank === 3) return "bg-gradient-to-r from-amber-600/20 to-orange-600/10 border-amber-600/50";
    return "bg-gray-800/30";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="clay-card p-6"
    >
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-400" />
        {title}
      </h3>

      <div className="space-y-3">
        {students.slice(0, 10).map((student, index) => {
          const rank = index + 1;
          const isCurrentUser = student.user_id === currentUserId;
          
          return (
            <motion.div
              key={student.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-xl border ${getRankBg(rank)} ${isCurrentUser ? 'ring-2 ring-purple-500' : ''}`}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                {getRankIcon(rank)}
              </div>
              
              {student.profile_image_url ? (
                <img
                  src={student.profile_image_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: student.avatar_color || "#8B5CF6" }}
                >
                  {(student.display_name || student.full_name || "ک").charAt(0)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">
                  {student.display_name || student.full_name}
                  {isCurrentUser && <span className="text-purple-400 text-sm mr-2">(شما)</span>}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">سطح {toPersianNumber(student.level || 1)}</span>
                  <span className="text-yellow-400">🪙 {toPersianNumber(student.coins || 0)}</span>
                </div>
              </div>
              
              <div className="text-left">
                <p className="text-lg font-bold text-purple-400">{toPersianNumber(student.score || 0)}</p>
                <p className="text-xs text-gray-500">امتیاز</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}