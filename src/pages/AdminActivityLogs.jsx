import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Search, Filter, Calendar } from "lucide-react";
import { toPersianDate, toPersianNumber } from "@/components/utils";
import { motion } from "framer-motion";

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState({});
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allLogs, allUsers] = await Promise.all([
        base44.entities.ActivityLog.list("-created_date", 100), // Last 100 logs
        base44.entities.PublicProfile.list()
      ]);
      setLogs(allLogs);
      
      const userMap = {};
      allUsers.forEach(u => userMap[u.user_id] = u);
      setUsers(userMap);
    } catch (error) {
      console.error("Error loading logs:", error);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const matchesType = filterType === "all" || log.activity_type === filterType;
    const user = users[log.user_id];
    const userName = user ? (user.display_name || user.full_name || "") : "";
    const matchesSearch = !searchTerm || userName.toLowerCase().includes(searchTerm.toLowerCase()) || (log.details && log.details.includes(searchTerm));
    return matchesType && matchesSearch;
  });

  const getActivityLabel = (type) => {
    const types = {
      submission: "ارسال تکلیف",
      login: "ورود به سیستم",
      badge_earned: "کسب نشان",
      level_up: "ارتقای سطح",
      quiz_completed: "تکمیل آزمون"
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-slate-950 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            گزارش فعالیت کاربران
          </h1>
          <p className="text-slate-400 text-lg">مشاهده و تحلیل ریز فعالیت‌های کاربران سیستم</p>
        </motion.div>

        <Card className="clay-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  placeholder="جستجو در نام کاربر یا جزئیات..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border-slate-800 pr-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="bg-slate-900 border-slate-800">
                    <SelectValue placeholder="نوع فعالیت" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="all">همه فعالیت‌ها</SelectItem>
                    <SelectItem value="submission">ارسال تکلیف</SelectItem>
                    <SelectItem value="login">ورود به سیستم</SelectItem>
                    <SelectItem value="badge_earned">کسب نشان</SelectItem>
                    <SelectItem value="level_up">ارتقای سطح</SelectItem>
                    <SelectItem value="quiz_completed">تکمیل آزمون</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={loadData} variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300">
                <Calendar className="w-4 h-4 mr-2" /> بروزرسانی
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-black/20">
                <TableRow className="border-white/10 hover:bg-black/30">
                  <TableHead className="text-slate-300">کاربر</TableHead>
                  <TableHead className="text-slate-300">نوع فعالیت</TableHead>
                  <TableHead className="text-slate-300">جزئیات</TableHead>
                  <TableHead className="text-slate-300">امتیاز</TableHead>
                  <TableHead className="text-slate-300">زمان</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const user = users[log.user_id];
                  return (
                    <TableRow key={log.id} className="border-white/10 hover:bg-black/20">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                           <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ backgroundColor: user?.avatar_color || '#64748b' }}
                            >
                              {(user?.full_name || "?").charAt(0)}
                            </div>
                            {user?.display_name || user?.full_name || "کاربر حذف شده"}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <span className="inline-block px-2 py-1 rounded text-xs bg-slate-800 border border-slate-700">
                          {getActivityLabel(log.activity_type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 max-w-md truncate" title={log.details}>
                        {log.details || "-"}
                      </TableCell>
                      <TableCell className="text-green-400 font-bold">
                        {log.points_earned > 0 ? `+${toPersianNumber(log.points_earned)}` : toPersianNumber(0)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {toPersianDate(log.created_date)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      هیچ فعالیتی یافت نشد.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}