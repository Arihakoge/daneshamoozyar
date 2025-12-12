import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { 
  Users, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Award,
  Target,
  MessageCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toPersianNumber, toPersianDateShort, normalizeScore } from "@/components/utils";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";

function ChildCard({ child, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="clay-card hover:shadow-lg transition-all duration-300 cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: child.avatar_color || "#8B5CF6" }}
            >
              {(child.display_name || child.full_name || "؟").charAt(0)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-white mb-1">
                {child.display_name || child.full_name}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-purple-100 text-purple-800">
                  پایه {child.grade}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  سطح {toPersianNumber(child.level || 1)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center clay-card p-3">
              <div className="text-2xl font-bold text-yellow-400">
                🪙 {toPersianNumber(child.coins || 0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">سکه</div>
            </div>
            <div className="text-center clay-card p-3">
              <div className="text-2xl font-bold text-green-400">
                {toPersianNumber(child.average_score?.toFixed(1) || "0")}
              </div>
              <div className="text-xs text-gray-400 mt-1">میانگین</div>
            </div>
            <div className="text-center clay-card p-3">
              <div className="text-2xl font-bold text-blue-400">
                {toPersianNumber(child.submission_count || 0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">تکالیف</div>
            </div>
          </div>

          {child.recent_assignments && child.recent_assignments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300 mb-2">تکالیف اخیر:</h4>
              {child.recent_assignments.slice(0, 2).map(assignment => (
                <div key={assignment.id} className="clay-card p-3 text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">{assignment.title}</p>
                      <p className="text-gray-400 text-xs">📚 {assignment.subject}</p>
                    </div>
                    {assignment.score !== undefined && assignment.score !== null ? (
                      <Badge className="bg-green-100 text-green-800">
                        {toPersianNumber(assignment.score)}/{toPersianNumber(assignment.max_score)}
                      </Badge>
                    ) : assignment.submitted ? (
                      <Badge className="bg-blue-100 text-blue-800">ارسال شده</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800">در انتظار</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button 
            className="w-full mt-4 clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white"
            onClick={() => window.location.href = createPageUrl("ParentChildDetail", { childId: child.user_id })}
          >
            مشاهده جزئیات
            <ChevronRight className="w-4 h-4 mr-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParentData();
  }, []);

  const loadParentData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get parent-child relationships
      const relationships = await base44.entities.ParentChild.filter({ parent_user_id: currentUser.id });
      
      if (relationships.length === 0) {
        setLoading(false);
        return;
      }

      // Get children profiles
      const childrenProfiles = await base44.entities.PublicProfile.list();
      const childIds = relationships.map(r => r.child_user_id);
      const childrenData = childrenProfiles.filter(p => childIds.includes(p.user_id));

      // Get submissions and assignments for each child
      const enrichedChildren = await Promise.all(
        childrenData.map(async (child) => {
          const [submissions, assignments] = await Promise.all([
            base44.entities.Submission.filter({ student_id: child.user_id }),
            base44.entities.Assignment.filter({ grade: child.grade })
          ]);

          // Calculate average score
          const gradedSubmissions = submissions.filter(s => s.score !== null && s.score !== undefined);
          let averageScore = 0;
          if (gradedSubmissions.length > 0) {
            const totalNormalized = gradedSubmissions.reduce((sum, sub) => {
              const assignment = assignments.find(a => a.id === sub.assignment_id);
              return sum + normalizeScore(sub.score, assignment?.max_score);
            }, 0);
            averageScore = totalNormalized / gradedSubmissions.length;
          }

          // Get recent assignments with submission status
          const recentAssignments = assignments.slice(0, 3).map(assignment => {
            const submission = submissions.find(s => s.assignment_id === assignment.id);
            return {
              ...assignment,
              submitted: !!submission,
              score: submission?.score,
              max_score: assignment.max_score
            };
          });

          return {
            ...child,
            submission_count: submissions.length,
            average_score: averageScore,
            recent_assignments: recentAssignments
          };
        })
      );

      setChildren(enrichedChildren);
    } catch (error) {
      console.error("خطا در بارگیری اطلاعات:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="w-10 h-10 text-purple-500" />
          پنل والدین
        </h1>
        <p className="text-gray-300 text-lg">
          پیگیری پیشرفت تحصیلی فرزندان شما
        </p>
      </motion.div>

      {children.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="clay-card p-12 text-center"
        >
          <Users className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            هنوز فرزندی تعریف نشده است
          </h2>
          <p className="text-gray-400 mb-6">
            برای افزودن فرزند، با مدیر سیستم تماس بگیرید
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {children.map((child, index) => (
              <ChildCard key={child.user_id} child={child} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="clay-card p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Target className="w-6 h-6 text-green-500" />
              نکات مهم برای والدین
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="clay-card p-4 bg-blue-900/20">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-200 mb-1">پیگیری منظم تکالیف</h3>
                    <p className="text-sm text-blue-300">
                      روزانه پیشرفت فرزندتان را بررسی و از او حمایت کنید
                    </p>
                  </div>
                </div>
              </div>
              <div className="clay-card p-4 bg-green-900/20">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h3 className="font-bold text-green-200 mb-1">تشویق و انگیزه</h3>
                    <p className="text-sm text-green-300">
                      موفقیت‌های کوچک را جشن بگیرید و انگیزه ایجاد کنید
                    </p>
                  </div>
                </div>
              </div>
              <div className="clay-card p-4 bg-purple-900/20">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h3 className="font-bold text-purple-200 mb-1">برنامه‌ریزی زمان</h3>
                    <p className="text-sm text-purple-300">
                      به فرزندتان کمک کنید زمان مطالعه منظم داشته باشد
                    </p>
                  </div>
                </div>
              </div>
              <div className="clay-card p-4 bg-orange-900/20">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-orange-400 mt-1" />
                  <div>
                    <h3 className="font-bold text-orange-200 mb-1">ارتباط با معلم</h3>
                    <p className="text-sm text-orange-300">
                      در صورت نیاز با معلمان در تماس باشید
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}