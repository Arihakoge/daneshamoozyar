import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  PlusCircle,
  Eye,
  Check,
  X,
  Calendar as CalendarIcon,
  LayoutGrid,
  Copy,
  Repeat,
  Save,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianDate, toPersianDateShort, toPersianNumber } from "@/components/utils";
import PersianDatePicker from "@/components/ui/PersianDatePicker";

// Simple Persian Calendar Component for Teacher View
const TeacherCalendarView = ({ assignments }) => {
  // Simplified calendar logic: Show next 30 days with deadlines
  const [days, setDays] = useState([]);

  useEffect(() => {
    const today = new Date();
    const next30Days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daysAssignments = assignments.filter(a => {
        if (!a.due_date) return false;
        // Compare YYYY-MM-DD
        return a.due_date.startsWith(dateStr);
      });

      next30Days.push({
        date: date,
        dateStr: dateStr,
        persianDate: toPersianDateShort(date),
        assignments: daysAssignments
      });
    }
    setDays(next30Days);
  }, [assignments]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {days.map((day, idx) => (
        <motion.div
          key={day.dateStr}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.02 }}
          className={`clay-card p-3 min-h-[150px] flex flex-col ${
            day.assignments.length > 0 ? 'border-purple-500/50' : 'opacity-80'
          }`}
        >
          <div className="text-center border-b border-gray-700/50 pb-2 mb-2">
            <span className="text-white font-bold">{day.persianDate}</span>
            {idx === 0 && <span className="block text-xs text-green-400">امروز</span>}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {day.assignments.length > 0 ? (
              day.assignments.map(a => (
                <div key={a.id} className="text-xs bg-slate-800/80 p-2 rounded border-r-2 border-purple-500 truncate">
                  <p className="text-white truncate" title={a.title}>{a.title}</p>
                  <p className="text-gray-400 text-[10px]">{a.grade} - {a.subject}</p>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-xs">
                بدون تکلیف
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

function SubmissionGradingCard({ submission, student, onGrade, maxScore }) {
  const [score, setScore] = useState(submission.score || "");
  const [feedback, setFeedback] = useState(submission.feedback || "");

  const handleGrade = () => {
    if (score !== "") {
      onGrade(submission.id, score, feedback);
    }
  };

  return (
    <Card className="clay-card p-4">
      <CardHeader>
        <CardTitle className="text-white">{student?.full_name || "دانش‌آموز ناشناس"}</CardTitle>
        <p className="text-sm text-gray-400">
          ارسال شده در: {toPersianDate(submission.submitted_at)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {submission.content && (
          <div>
            <span className="font-bold text-white">پاسخ متنی: </span>
            <p className="text-gray-300">{submission.content}</p>
          </div>
        )}
        {submission.file_url && (
          <a 
            href={submission.file_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="clay-button p-2 inline-block text-white"
          >
            مشاهده فایل ضمیمه
          </a>
        )}
        
        {submission.status === 'graded' ? (
          <div className="clay-card bg-green-500/10 p-4">
            <p className="text-white">
              <span className="font-bold">نمره:</span> {toPersianNumber(submission.score)} از {toPersianNumber(maxScore)}
            </p>
            {submission.feedback && (
              <p className="text-gray-300 mt-2">
                <span className="font-bold">بازخورد:</span> {submission.feedback}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Input 
              type="number" 
              placeholder="نمره" 
              value={score} 
              onChange={e => setScore(e.target.value)} 
              max={maxScore} 
              min="0" 
              className="clay-card text-white" 
            />
            <Textarea 
              placeholder="بازخورد (اختیاری)" 
              value={feedback} 
              onChange={e => setFeedback(e.target.value)} 
              className="clay-card text-white"
            />
            <Button 
              onClick={handleGrade} 
              className="w-full clay-button bg-green-500 text-white hover:bg-green-600"
            >
              <Check className="mr-2 h-4 w-4" /> ثبت نمره
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeacherAssignments() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Assignment Form State
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    max_score: 20,
    coins_reward: 10,
    grade: "",
    subject: "",
    class_id: "",
    type: "homework" // homework, quiz, project
  });

  // Recurring & Template Options
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(1);

  // Derived options for dropdowns
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [canAssignToAllClasses, setCanAssignToAllClasses] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      
      // Fetch full profile to ensure we have the latest teaching assignments
      const profiles = await base44.entities.PublicProfile.filter({ user_id: currentUser.id });
      const userProfile = profiles.length > 0 ? profiles[0] : currentUser;
      
      setUser(userProfile);
      const allClasses = await base44.entities.Class.list();
      setClasses(allClasses);

      // Initialize dropdown options
      if (userProfile.teaching_assignments && userProfile.teaching_assignments.length > 0) {
        const subjs = [...new Set(userProfile.teaching_assignments.map(a => a.subject))];
        setAvailableSubjects(subjs);
      } else {
        setAvailableSubjects(userProfile.subjects || (userProfile.subject ? [userProfile.subject] : []));
      }

      const [teacherAssignments, teacherTemplates] = await Promise.all([
        base44.entities.Assignment.filter({ teacher_id: currentUser.id }, "-created_date"),
        base44.entities.AssignmentTemplate.filter({ teacher_id: currentUser.id }, "-created_date")
      ]);
      
      setAssignments(teacherAssignments);
      setTemplates(teacherTemplates);
      
      const assignmentIds = teacherAssignments.map(a => a.id);
      if (assignmentIds.length > 0) {
        const allSubmissions = await base44.entities.Submission.list();
        const filteredSubmissions = allSubmissions.filter(s => assignmentIds.includes(s.assignment_id));
        setSubmissions(filteredSubmissions);
      } else {
        setSubmissions([]);
      }

      const allUsers = await base44.entities.User.list();
      setStudents(allUsers.filter(u => u.student_role === 'student'));
      
    } catch (error) {
      console.error("خطا در بارگیری داده‌ها:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update available grades when subject changes
  useEffect(() => {
    if (!user) return;
    if (user.teaching_assignments && user.teaching_assignments.length > 0) {
      if (newAssignment.subject) {
        const relevant = user.teaching_assignments.filter(a => a.subject === newAssignment.subject);
        const grades = [...new Set(relevant.map(a => a.grade))];
        setAvailableGrades(grades);
      } else {
        setAvailableGrades([]);
      }
    } else {
      setAvailableGrades(["هفتم", "هشتم", "نهم"]);
    }
  }, [newAssignment.subject, user]);

  // Update available classes when grade changes
  useEffect(() => {
    if (!user) return;
    if (!newAssignment.grade || !newAssignment.subject) {
      setAvailableClasses([]);
      return;
    }

    if (user.teaching_assignments && user.teaching_assignments.length > 0) {
      const relevant = user.teaching_assignments.filter(a => 
        a.subject === newAssignment.subject && a.grade === newAssignment.grade
      );
      
      const allowsAll = relevant.some(a => !a.class_id);
      
      if (allowsAll) {
        setAvailableClasses(classes.filter(c => c.grade === newAssignment.grade));
        setCanAssignToAllClasses(true);
      } else {
        const allowedClassIds = relevant.map(a => a.class_id).filter(Boolean);
        setAvailableClasses(classes.filter(c => allowedClassIds.includes(c.id)));
        setCanAssignToAllClasses(false);
      }
    } else {
      setAvailableClasses(classes.filter(c => c.grade === newAssignment.grade));
      setCanAssignToAllClasses(true);
    }
  }, [newAssignment.grade, newAssignment.subject, user, classes]);
  
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const baseData = {
        ...newAssignment,
        teacher_id: user.id,
        is_active: true
      };

      // Create initial assignment
      await base44.entities.Assignment.create(baseData);

      // Handle Recurring
      if (isRecurring && recurringWeeks > 1 && baseData.due_date) {
        const initialDate = new Date(baseData.due_date);
        const recurringAssignments = [];
        
        for (let i = 1; i < recurringWeeks; i++) {
          const nextDate = new Date(initialDate);
          nextDate.setDate(initialDate.getDate() + (i * 7)); // Add 7 days for each week
          
          recurringAssignments.push({
            ...baseData,
            title: `${baseData.title} (هفته ${i + 1})`,
            due_date: nextDate.toISOString() // Standard ISO format for storage
          });
        }
        
        if (recurringAssignments.length > 0) {
           // Create them one by one or bulk if supported (using loop for safety)
           for(const ra of recurringAssignments) {
             await base44.entities.Assignment.create(ra);
           }
        }
      }

      // Handle Template Saving
      if (saveAsTemplate && templateName) {
        await base44.entities.AssignmentTemplate.create({
          title: templateName,
          description: newAssignment.description,
          type: newAssignment.type || "homework",
          max_score: newAssignment.max_score,
          coins_reward: newAssignment.coins_reward,
          teacher_id: user.id
        });
      }

      setCreateModalOpen(false);
      resetForm();
      loadData();
    } catch(error) {
      console.error("خطا در ایجاد تکلیف:", error);
    }
  };

  const resetForm = () => {
    setNewAssignment({
      title: "",
      description: "",
      due_date: "",
      max_score: 20,
      coins_reward: 10,
      grade: "",
      subject: "",
      class_id: "",
      type: "homework"
    });
    setSaveAsTemplate(false);
    setTemplateName("");
    setIsRecurring(false);
    setRecurringWeeks(1);
  };

  const loadTemplate = (template) => {
    setNewAssignment(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      max_score: template.max_score,
      coins_reward: template.coins_reward,
      type: template.type || "homework"
    }));
  };

  const handleGradeSubmission = async (submissionId, score, feedback) => {
    try {
      await base44.entities.Submission.update(submissionId, { score: Number(score), feedback, status: 'graded' });
      loadData();
    } catch (error) {
      console.error("خطا در ثبت نمره:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white font-medium">در حال بارگیری تکالیف...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FileText className="w-10 h-10 text-purple-500" />
            مدیریت تکالیف
          </h1>
          <p className="text-gray-300 text-lg">تکالیف خود را ایجاد، زمان‌بندی و مدیریت کنید</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
             <Button 
               variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
               size="sm"
               onClick={() => setViewMode('grid')}
               className={viewMode === 'grid' ? "bg-purple-600 text-white" : "text-gray-400"}
             >
               <LayoutGrid className="w-4 h-4 mr-2" /> لیست
             </Button>
             <Button 
               variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
               size="sm"
               onClick={() => setViewMode('calendar')}
               className={viewMode === 'calendar' ? "bg-purple-600 text-white" : "text-gray-400"}
             >
               <CalendarIcon className="w-4 h-4 mr-2" /> تقویم
             </Button>
           </div>
          <Button 
            onClick={() => setCreateModalOpen(true)} 
            className="clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> تکلیف جدید
          </Button>
        </div>
      </motion.div>

      {viewMode === 'calendar' ? (
        <TeacherCalendarView assignments={assignments} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment, index) => (
            <motion.div 
              key={assignment.id} 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: index * 0.1 }}
            >
              <Card className="clay-card h-full flex flex-col relative group">
                {assignment.type && (
                  <div className="absolute top-2 left-2 z-10">
                     <Badge variant="outline" className="bg-slate-900/50 border-slate-700 text-xs">
                       {assignment.type === 'quiz' ? 'آزمون' : assignment.type === 'project' ? 'پروژه' : 'تمرین'}
                     </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl text-white pr-2">{assignment.title}</CardTitle>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge className="bg-purple-500/20 text-purple-300">
                      {assignment.subject}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-300">
                      {assignment.grade}
                    </Badge>
                    {assignment.class_id && (
                      <Badge className="bg-green-500/20 text-green-300">
                        {classes.find(c => c.id === assignment.class_id)?.name || "کلاس"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-gray-300 mb-4 line-clamp-3">{assignment.description}</p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      مهلت: {toPersianDateShort(assignment.due_date)}
                    </p>
                    <div className="flex justify-between items-center">
                      <p>امتیاز: {toPersianNumber(assignment.max_score)}</p>
                      <p>پاداش: 🪙 {toPersianNumber(assignment.coins_reward)}</p>
                    </div>
                  </div>
                </CardContent>
                <div className="p-4">
                  <Button 
                    onClick={() => { 
                      setSelectedAssignment(assignment); 
                      setSubmissionsModalOpen(true); 
                    }} 
                    className="w-full clay-button text-white hover:bg-purple-500/20"
                  >
                    <Eye className="mr-2 h-4 w-4" /> 
                    مشاهده ارسال‌ها ({toPersianNumber(submissions.filter(s => s.assignment_id === assignment.id).length)})
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {assignments.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="clay-card p-12 text-center"
        >
          <FileText className="w-24 h-24 text-gray-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">هنوز تکلیفی ندارید!</h3>
          <p className="text-gray-400 mb-6">با کلیک بر روی "تکلیف جدید" اولین تکلیف خود را ایجاد کنید.</p>
        </motion.div>
      )}
      
      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setCreateModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }} 
              className="clay-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-6 h-6 text-purple-400" />
                  ایجاد تکلیف جدید
                </h2>
                <Button variant="ghost" onClick={() => setCreateModalOpen(false)} className="clay-button">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Template Section */}
              {templates.length > 0 && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Copy className="w-4 h-4" /> استفاده از الگوهای آماده:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => loadTemplate(t)}
                        className="whitespace-nowrap px-3 py-1.5 bg-slate-700 hover:bg-purple-600 text-white text-xs rounded-lg transition-colors flex items-center gap-2"
                      >
                        {t.type === 'quiz' && <span className="w-2 h-2 rounded-full bg-red-400" />}
                        {t.type === 'project' && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                        {t.type === 'homework' && <span className="w-2 h-2 rounded-full bg-green-400" />}
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableSubjects.length === 0 ? (
                <div className="text-center text-red-400 mb-4 p-4 bg-red-500/10 rounded-xl">
                  شما هنوز درسی برای تدریس ندارید. لطفاً با مدیر تماس بگیرید.
                </div>
              ) : (
                <form onSubmit={handleCreateAssignment} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-300 mb-1">عنوان تکلیف</label>
                      <Input 
                        placeholder="مثال: حل تمرینات فصل دوم" 
                        value={newAssignment.title} 
                        onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} 
                        required 
                        className="clay-card text-white"
                      />
                    </div>
                    <div>
                       <label className="block text-sm text-gray-300 mb-1">نوع</label>
                       <select
                         value={newAssignment.type}
                         onChange={e => setNewAssignment({...newAssignment, type: e.target.value})}
                         className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700 h-10"
                       >
                         <option value="homework">تکلیف منزل</option>
                         <option value="quiz">آزمون کلاسی</option>
                         <option value="project">پروژه عملی</option>
                       </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">درس</label>
                      <select
                        value={newAssignment.subject}
                        onChange={e => setNewAssignment({...newAssignment, subject: e.target.value, grade: "", class_id: ""})}
                        required
                        className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700"
                      >
                        <option value="">انتخاب کنید</option>
                        {availableSubjects.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1">پایه</label>
                      <select
                        value={newAssignment.grade}
                        onChange={e => setNewAssignment({...newAssignment, grade: e.target.value, class_id: ""})}
                        required
                        className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700"
                        disabled={!newAssignment.subject}
                      >
                        <option value="">انتخاب کنید</option>
                        {availableGrades.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">کلاس</label>
                      <select
                        value={newAssignment.class_id}
                        onChange={e => setNewAssignment({...newAssignment, class_id: e.target.value})}
                        className="w-full p-2 rounded-md bg-slate-800 text-white border border-slate-700"
                        disabled={!newAssignment.grade}
                        required={!canAssignToAllClasses}
                      >
                        {canAssignToAllClasses ? (
                          <option value="">همه کلاس‌های پایه</option>
                        ) : (
                          <option value="" disabled>یک کلاس انتخاب کنید</option>
                        )}
                        {availableClasses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Textarea 
                    placeholder="توضیحات و دستورالعمل‌ها..." 
                    value={newAssignment.description} 
                    onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} 
                    required 
                    className="clay-card text-white min-h-[100px]"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">مهلت تحویل</label>
                      <PersianDatePicker
                        value={newAssignment.due_date}
                        onChange={(date) => setNewAssignment({...newAssignment, due_date: date})}
                        placeholder="انتخاب تاریخ"
                      />
                    </div>
                    <div>
                       <label className="block text-sm text-gray-300 mb-1">حداکثر نمره</label>
                       <Input 
                        type="number" 
                        value={newAssignment.max_score} 
                        onChange={e => setNewAssignment({...newAssignment, max_score: parseInt(e.target.value, 10) || 0})} 
                        className="clay-card text-white"
                      />
                    </div>
                    <div>
                       <label className="block text-sm text-gray-300 mb-1">پاداش سکه</label>
                       <Input 
                        type="number" 
                        value={newAssignment.coins_reward} 
                        onChange={e => setNewAssignment({...newAssignment, coins_reward: parseInt(e.target.value, 10) || 0})} 
                        className="clay-card text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Advanced Options: Recurring & Template */}
                  <div className="bg-slate-800/30 p-4 rounded-xl space-y-4 border border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="recurring" 
                        checked={isRecurring}
                        onChange={e => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                      />
                      <label htmlFor="recurring" className="text-sm text-white flex items-center gap-2 cursor-pointer">
                        <Repeat className="w-4 h-4 text-blue-400" />
                        تکرار این تکلیف (هفتگی)
                      </label>
                    </div>
                    
                    {isRecurring && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }}
                        className="flex items-center gap-3 pl-6"
                      >
                        <span className="text-sm text-gray-400">به مدت</span>
                        <select 
                          value={recurringWeeks}
                          onChange={e => setRecurringWeeks(parseInt(e.target.value))}
                          className="bg-slate-700 text-white rounded px-2 py-1 text-sm border border-slate-600"
                        >
                          {[2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-sm text-gray-400">هفته آینده</span>
                      </motion.div>
                    )}

                    <div className="border-t border-slate-700/50 pt-3 mt-3">
                       <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="saveTemplate" 
                          checked={saveAsTemplate}
                          onChange={e => setSaveAsTemplate(e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-purple-500 focus:ring-purple-500"
                        />
                        <label htmlFor="saveTemplate" className="text-sm text-white flex items-center gap-2 cursor-pointer">
                          <Save className="w-4 h-4 text-green-400" />
                          ذخیره به عنوان الگو
                        </label>
                      </div>
                      {saveAsTemplate && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-2 pl-6"
                        >
                          <Input
                            placeholder="نام الگو (مثلاً: تمرین هفتگی ریاضی)"
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setCreateModalOpen(false)} 
                      className="flex-1 clay-button text-white"
                    >
                      انصراف
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 clay-button bg-purple-500 text-white hover:bg-purple-600"
                    >
                      {isRecurring ? `ایجاد ${recurringWeeks} تکلیف` : 'ایجاد تکلیف'}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
        
        {/* Submissions Modal */}
        {isSubmissionsModalOpen && selectedAssignment && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setSubmissionsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }} 
              className="clay-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">ارسال‌های تکلیف: {selectedAssignment.title}</h2>
                  <p className="text-gray-400 mt-1">
                    {toPersianNumber(submissions.filter(s => s.assignment_id === selectedAssignment.id).length)} ارسال
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSubmissionsModalOpen(false)} 
                  className="clay-button text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-4">
                {submissions.filter(s => s.assignment_id === selectedAssignment.id).length > 0 ? (
                  submissions.filter(s => s.assignment_id === selectedAssignment.id).map(sub => {
                    const student = students.find(st => st.id === sub.student_id);
                    return (
                      <SubmissionGradingCard 
                        key={sub.id} 
                        submission={sub} 
                        student={student} 
                        onGrade={handleGradeSubmission} 
                        maxScore={selectedAssignment.max_score} 
                      />
                    );
                  })
                ) : (
                  <p className="text-center text-gray-400 py-8">هنوز ارسالی برای این تکلیف ثبت نشده است.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}