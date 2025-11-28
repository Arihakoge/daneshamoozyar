import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { BookOpen, TrendingUp } from "lucide-react";
import { toPersianNumber } from "@/components/utils";

const subjectColors = {
  "ریاضی": "#3B82F6",
  "علوم": "#10B981",
  "فارسی": "#EC4899",
  "زبان": "#F59E0B",
  "عربی": "#8B5CF6"
};

export default function SubjectProgressChart({ subjectStats, viewType = "bar" }) {
  if (!subjectStats || subjectStats.length === 0) {
    return (
      <div className="clay-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">پیشرفت در دروس</h2>
        </div>
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>هنوز داده‌ای برای نمایش وجود ندارد</p>
        </div>
      </div>
    );
  }

  const chartData = subjectStats.map(stat => ({
    subject: stat.subject,
    average: Math.round(stat.average * 10) / 10,
    count: stat.count,
    fullMark: 20,
    fill: subjectColors[stat.subject] || "#8B5CF6"
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="clay-card p-3 bg-gray-900 text-white">
          <p className="font-bold">{data.subject}</p>
          <p className="text-sm">میانگین: {toPersianNumber(data.average)}</p>
          <p className="text-sm text-gray-400">{toPersianNumber(data.count)} تکلیف</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="clay-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">پیشرفت در دروس</h2>
      </div>

      {viewType === "radar" ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
            <PolarRadiusAxis angle={90} domain={[0, 20]} stroke="#9CA3AF" />
            <Radar
              name="میانگین نمره"
              dataKey="average"
              stroke="#8B5CF6"
              fill="#8B5CF6"
              fillOpacity={0.5}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" domain={[0, 20]} stroke="#9CA3AF" />
            <YAxis dataKey="subject" type="category" stroke="#9CA3AF" width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="average" radius={[0, 8, 8, 0]} fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Subject Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {subjectStats.map((stat) => (
          <div
            key={stat.subject}
            className="clay-card p-3 text-center"
            style={{ borderColor: subjectColors[stat.subject], borderWidth: "2px" }}
          >
            <p className="font-bold text-white text-sm mb-1">{stat.subject}</p>
            <p className="text-2xl font-bold" style={{ color: subjectColors[stat.subject] }}>
              {toPersianNumber(Math.round(stat.average * 10) / 10)}
            </p>
            <p className="text-xs text-gray-400">{toPersianNumber(stat.count)} تکلیف</p>
          </div>
        ))}
      </div>
    </div>
  );
}