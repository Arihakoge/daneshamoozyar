import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, User } from "lucide-react";
import { toPersianNumber } from "@/components/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Leaderboard({ currentUser }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("class"); // 'global' or 'class'
  const [sortBy, setSortBy] = useState("coins"); // 'coins' or 'level'

  useEffect(() => {
    loadLeaders();
  }, [filter, sortBy, currentUser]);

  const loadLeaders = async () => {
    setLoading(true);
    try {
      let query = { student_role: "student" };
      
      if (filter === "class" && currentUser?.class_id) {
        query.class_id = currentUser.class_id;
      }

      const sortField = sortBy === "coins" ? "-coins" : "-level";
      const profiles = await base44.entities.PublicProfile.filter(query, sortField, 50);
      
      setLeaders(profiles);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    }
    setLoading(false);
  };

  const getRankStyle = (index) => {
    switch (index) {
      case 0: return "bg-yellow-500/20 border-yellow-500 text-yellow-500";
      case 1: return "bg-gray-400/20 border-gray-400 text-gray-400";
      case 2: return "bg-orange-700/20 border-orange-700 text-orange-700";
      default: return "bg-slate-800/50 border-slate-700 text-slate-400";
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Medal className="w-6 h-6 text-orange-600" />;
      default: return <span className="text-lg font-bold w-6 text-center">{toPersianNumber(index + 1)}</span>;
    }
  };

  if (loading) return <div className="text-center p-8 text-gray-400">در حال بارگیری رتبه‌بندی...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          <Button 
            variant={filter === "class" ? "default" : "outline"}
            onClick={() => setFilter("class")}
            className={filter === "class" ? "bg-purple-600" : "text-gray-400 border-gray-600"}
          >
            کلاس من
          </Button>
          <Button 
            variant={filter === "global" ? "default" : "outline"}
            onClick={() => setFilter("global")}
            className={filter === "global" ? "bg-purple-600" : "text-gray-400 border-gray-600"}
          >
            کل مدرسه
          </Button>
        </div>

        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-lg">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setSortBy("coins")}
            className={sortBy === "coins" ? "bg-yellow-500/20 text-yellow-400" : "text-gray-400"}
          >
            بیشترین سکه
          </Button>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => setSortBy("level")}
            className={sortBy === "level" ? "bg-blue-500/20 text-blue-400" : "text-gray-400"}
          >
            بالاترین سطح
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {leaders.length > 0 ? (
          leaders.map((student, index) => {
            const isMe = student.user_id === currentUser?.id;
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`clay-card border-l-4 ${isMe ? 'bg-purple-900/20 border-l-purple-500' : 'border-l-transparent'} hover:bg-slate-800/50 transition-colors`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${getRankStyle(index).split(' ')[1]}`}>
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                         <h3 className={`font-bold text-lg ${isMe ? 'text-purple-300' : 'text-white'}`}>
                           {student.display_name || student.full_name}
                         </h3>
                         {isMe && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">شما</span>}
                      </div>
                      <p className="text-sm text-gray-400">سطح {toPersianNumber(student.level || 1)}</p>
                    </div>

                    <div className="text-left">
                      <p className="text-xl font-bold text-yellow-400">🪙 {toPersianNumber(student.coins || 0)}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">
            هنوز داده‌ای برای نمایش وجود ندارد.
          </div>
        )}
      </div>
    </div>
  );
}