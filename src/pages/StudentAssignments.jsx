import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calendar, 
  FileText,
  Upload,
  X,
  CheckCircle,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { toPersianDate, toPersianDateShort, formatDaysRemaining, isOverdue, toPersianNumber } from "@/components/utils";
import { motion, AnimatePresence } from "framer-motion";
import { checkAndAwardBadges } from "@/components/gamification/BadgeSystem";
import { toast } from "sonner";

export default function StudentAssignments() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterSubject, setFilterSubject] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.grade) {
        const gradeAssignments = await base44.entities.Assignment.filter(
          { grade: currentUser.grade, is_active: true }, 
          "-created_date"
        );
        // Filter by class_id if assignment is specific to a class
        const filteredAssignments = gradeAssignments.filter(a => 
          !a.class_id || (currentUser.class_id && a.class_id === currentUser.class_id)
        );
        setAssignments(filteredAssignments);

        const validAssignmentIds = filteredAssignments.map(a => a.id);

        const userSubmissions = await base44.entities.Submission.filter(
          { student_id: currentUser.id }, 
          "-created_date"
        );
        // Filter out submissions for deleted assignments
        const validSubmissions = userSubmissions.filter(s => validAssignmentIds.includes(s.assignment_id));
        setSubmissions(validSubmissions);

        const userBookmarks = await base44.entities.Bookmark.filter({ user_id: currentUser.id });
        // Filter out bookmarks for deleted assignments
        const validBookmarks = userBookmarks.filter(b => validAssignmentIds.includes(b.assignment_id));
        setBookmarks(validBookmarks);
      }
    } catch (error) {
      console.error("خطا در بارگیری داده‌ها:", error);
    }
    setLoading(false);
  };

  const toggleBookmark = async (assignmentId) => {
    try {
      const existingBookmark = bookmarks.find(b => b.assignment_id === assignmentId);
      
      if (existingBookmark) {
        await base44.entities.Bookmark.delete(existingBookmark.id);
        setBookmarks(bookmarks.filter(b => b.id !== existingBookmark.id));
      } else {
        const newBookmark = await base44.entities.Bookmark.create({
          user_id: user.id,
          assignment_id: assignmentId,
          priority: "medium"
        });
        setBookmarks([...bookmarks, newBookmark]);
      }
    } catch (error) {
      console.error("خطا در بوکمارک:", error);
    }
  };

  const isBookmarked = (assignmentId) => {
    return bookmarks.some(b => b.assignment_id === assignmentId);
  };

  const getAssignmentStatus = (assignment) => {
    const submission = submissions.find(s => s.assignment_id === assignment.id);
    const overdueStatus = assignment.due_date && isOverdue(assignment.due_date);
    
    if (submission) {
      if (submission.status === "graded") {
        return { status: "graded", text: "نمره داده شده", color: "green", score: submission.score };
      }
      return { status: "submitted", text: "ارسال شده", color: "blue" };
    }
    
    if (overdueStatus) {
      return { status: "overdue", text: "مهلت گذشته", color: "red" };
    }
    
    return { status: "pending", text: "در انتظار ارسال", color: "orange" };
  };

  const submitAssignment = async () => {
    if (!selectedAssignment || (!submissionContent.trim() && !submissionFile)) {
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = "";
      if (submissionFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: submissionFile });
        fileUrl = uploadResult.file_url;
      }

      const submissionData = {
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        content: submissionContent,
        file_url: fileUrl,
        submitted_at: new Date().toISOString(),
        status: "pending"
      };

      await base44.entities.Submission.create(submissionData);
      
      await base44.auth.updateMe({
        coins: (user.coins || 0) + selectedAssignment.coins_reward
      });

      // Check for badges
      const newBadges = await checkAndAwardBadges(user.id, 'submission', { assignment: selectedAssignment });
      if (newBadges.length > 0) {
        toast.success(`تبریک! شما ${newBadges.length} نشان جدید کسب کردید!`);
      }

      setSelectedAssignment(null);
      setSubmissionContent("");
      setSubmissionFile(null);
      loadData();
    } catch (error) {
      console.error("خطا در ارسال تکلیف:", error);
    }
    setSubmitting(false);
  };

  const filteredAssignments = filterSubject === "all" 
    ? assignments 
    : assignments.filter(a => a.subject === filterSubject);

  const SUBJECTS_BY_GRADE = {
    "هفتم": ["قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی", "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "تفکر و سبک زندگی"],
    "هشتم": ["قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی", "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "تفکر و سبک زندگی"],
    "نهم": ["قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی", "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "آمادگی دفاعی"]
  };

  const subjects = user?.grade ? (SUBJECTS_BY_GRADE[user.grade] || []) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری تکالیف...</p>
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
          <BookOpen className="w-10 h-10 text-purple-500" />
          تکالیف {user?.grade || "من"}
        </h1>
        <p className="text-gray-300 text-lg">
          تکالیف تمام دروس پایه {user?.grade}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay-card p-4 mb-6"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-white font-medium">فیلتر بر اساس درس:</span>
          <button
            onClick={() => setFilterSubject("all")}
            className={`clay-button px-4 py-2 ${filterSubject === "all" ? "active" : ""}`}
          >
            همه دروس
          </button>
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setFilterSubject(subject)}
              className={`clay-button px-4 py-2 ${filterSubject === subject ? "active" : ""}`}
            >
              📚 {subject}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssignments.map((assignment, index) => {
          const status = getAssignmentStatus(assignment);
          const submission = submissions.find(s => s.assignment_id === assignment.id);
          const daysLeft = formatDaysRemaining(assignment.due_date);
          
          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="clay-card hover:shadow-lg transition-shadow duration-300 h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl text-white">
                          {assignment.title}
                        </CardTitle>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(assignment.id);
                          }}
                          className="clay-button p-2 hover:bg-yellow-500/20 transition-colors"
                        >
                          {isBookmarked(assignment.id) ? (
                            <BookmarkCheck className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Bookmark className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-purple-100 text-purple-800">
                          📚 {assignment.subject}
                        </Badge>
                        <Badge className={`
                          ${status.color === 'green' ? 'bg-green-100 text-green-800' : ''}
                          ${status.color === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                          ${status.color === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                          ${status.color === 'red' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {status.text}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="clay-button px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
                        🪙 {toPersianNumber(assignment.coins_reward)}
                      </div>
                      {status.score !== undefined && (
                        <div className="clay-button px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white mt-2">
                          ⭐ {toPersianNumber(status.score)}/{toPersianNumber(assignment.max_score)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-300 leading-relaxed">
                    {assignment.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        مهلت: {toPersianDateShort(assignment.due_date)}
                      </span>
                    </div>
                    {!isOverdue(assignment.due_date) && (
                      <div className="text-orange-300 font-medium">
                        ⏰ {daysLeft}
                      </div>
                    )}
                    <div className="text-gray-300">
                      حداکثر نمره: {toPersianNumber(assignment.max_score)}
                    </div>
                  </div>

                  {submission && submission.feedback && (
                    <div className="clay-card p-4 bg-blue-900/20">
                      <h4 className="font-bold text-blue-200 mb-2">بازخورد معلم:</h4>
                      <p className="text-blue-300">{submission.feedback}</p>
                    </div>
                  )}

                  {status.status === "pending" && (
                    <Button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="w-full clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      ارسال تکلیف
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredAssignments.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {filterSubject === "all" 
              ? `هیچ تکلیفی برای پایه ${user?.grade} تعریف نشده است`
              : `هیچ تکلیفی برای درس ${filterSubject} تعریف نشده است`
            }
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedAssignment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  ارسال تکلیف: {selectedAssignment.title}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedAssignment(null)}
                  className="clay-button text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    متن پاسخ:
                  </label>
                  <Textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="پاسخ خود را اینجا بنویسید..."
                    className="clay-card h-32 text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    فایل ضمیمه (اختیاری):
                  </label>
                  <div className="clay-card p-4">
                    <Input
                      type="file"
                      onChange={(e) => setSubmissionFile(e.target.files[0])}
                      className="clay-card text-white"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    />
                    {submissionFile && (
                      <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        فایل انتخاب شد: {submissionFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedAssignment(null)}
                    variant="outline"
                    className="flex-1 clay-button text-white"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={submitAssignment}
                    disabled={submitting || (!submissionContent.trim() && !submissionFile)}
                    className="flex-1 clay-button bg-gradient-to-r from-green-500 to-blue-500 text-white"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        در حال ارسال...
                      </span>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        ارسال تکلیف
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}