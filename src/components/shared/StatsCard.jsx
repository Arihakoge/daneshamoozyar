import React from 'react';
import { motion } from 'framer-motion';

export default function StatsCard({ title, value, icon: Icon, color = "purple", trend, delay = 0 }) {
  const colorClasses = {
    purple: "text-purple-400",
    blue: "text-blue-400", 
    pink: "text-pink-400",
    green: "text-green-400",
    orange: "text-orange-400",
    red: "text-red-400"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="clay-card p-6 relative overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-1">{value}</p>
          {trend && (
            <p className="text-xs text-green-400 font-medium">↗ {trend}</p>
          )}
        </div>
        <Icon className={`w-10 h-10 ${colorClasses[color]}`} />
      </div>
    </motion.div>
  );
}