import React, { useState, useEffect } from "react";
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
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianDate, toPersianDateShort, toPersianNumber } from "@/components/utils";

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
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isSubmissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    max_score: 20,
    coins_reward: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const teacherAssignments = await base44.entities.Assignment.filter({
        teacher_id: currentUser.id,
        grade: currentUser.grade,
        subject: currentUser.subject
      }, "-created_date");
      setAssignments(teacherAssignments);
      
      const assignmentIds = teacherAssignments.map(a => a.id);
      const allSubmissions = await base44.entities.Submission.list();
      const filteredSubmissions = allSubmissions.filter(s => assignmentIds.includes(s.assignment_id));
      setSubmissions(filteredSubmissions);

      const allUsers = await base44.entities.User.list();
      setStudents(allUsers.filter(u => u.grade === currentUser.grade && u.student_role === 'student'));
      
    } catch (error) {
      console.error("خطا در بارگیری داده‌ها:", error);
    }
    setLoading(false);
  };
  
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      await base44.entities.Assignment.create({ 
        ...newAssignment, 
        teacher_id: user.id,
        grade: user.grade,
        subject: user.subject,
        is_active: true 
      });
      setCreateModalOpen(false);
      setNewAssignment({ title: "", description: "", due_date: "", max_score: 20, coins_reward: 10 });
      loadData();
    } catch(error) {
      console.error("خطا در ایجاد تکلیف:", error);
    }
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
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FileText className="w-10 h-10 text-purple-500" />
            تکالیف {user?.subject} - پایه {user?.grade}
          </h1>
          <p className="text-gray-300 text-lg">مدیریت تکالیف درس خود</p>
        </div>
        <Button 
          onClick={() => setCreateModalOpen(true)} 
          className="clay-button bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> تکلیف جدید
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment, index) => (
          <motion.div 
            key={assignment.id} 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: index * 0.1 }}
          >
            <Card className="clay-card h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl text-white">{assignment.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-purple-500/20 text-purple-300">
                    {assignment.subject}
                  </Badge>
                  <Badge className="bg-blue-500/20 text-blue-300">
                    {assignment.grade}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-gray-300 mb-4">{assignment.description}</p>
                <div className="text-sm text-gray-400 space-y-1">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    مهلت: {toPersianDateShort(assignment.due_date)}
                  </p>
                  <p>امتیاز: {toPersianNumber(assignment.max_score)}</p>
                  <p>پاداش: 🪙 {toPersianNumber(assignment.coins_reward)}</p>
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setCreateModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }} 
              className="clay-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">ایجاد تکلیف جدید</h2>
                <Button variant="ghost" onClick={() => setCreateModalOpen(false)} className="clay-button">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-gray-400 mb-4">برای: {user?.subject} - پایه {user?.grade}</p>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <Input 
                  placeholder="عنوان تکلیف" 
                  value={newAssignment.title} 
                  onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} 
                  required 
                  className="clay-card text-white"
                />
                <Textarea 
                  placeholder="توضیحات" 
                  value={newAssignment.description} 
                  onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} 
                  required 
                  className="clay-card text-white"
                />
                <Input 
                  type="date" 
                  value={newAssignment.due_date} 
                  onChange={e => setNewAssignment({...newAssignment, due_date: e.target.value})} 
                  required 
                  className="clay-card text-white"
                />
                <Input 
                  type="number" 
                  placeholder="حداکثر نمره" 
                  value={newAssignment.max_score} 
                  onChange={e => setNewAssignment({...newAssignment, max_score: parseInt(e.target.value, 10) || 0})} 
                  required 
                  className="clay-card text-white"
                />
                <Input 
                  type="number" 
                  placeholder="پاداش سکه" 
                  value={newAssignment.coins_reward} 
                  onChange={e => setNewAssignment({...newAssignment, coins_reward: parseInt(e.target.value, 10) || 0})} 
                  required 
                  className="clay-card text-white"
                />
                <div className="flex gap-4">
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
                    ایجاد
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        
        {/* Submissions Modal */}
        {isSubmissionsModalOpen && selectedAssignment && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSubmissionsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.9 }} 
              className="clay-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto" 
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