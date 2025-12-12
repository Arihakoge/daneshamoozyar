import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Download, FileText, HelpCircle, Target, Upload, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ContentGenerator() {
  const [activeTab, setActiveTab] = useState("lesson");
  
  // Lesson Content
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [grade, setGrade] = useState("");
  const [contentType, setContentType] = useState("explanation");
  
  // Question Generator
  const [questionTopic, setQuestionTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("5");
  const [questionDifficulty, setQuestionDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("multiple_choice");
  
  // File Summary
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summaryType, setSummaryType] = useState("brief");
  
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);

  const generateLessonContent = async () => {
    if (!subject || !topic || !grade) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    setLoading(true);
    try {
      let prompt = "";
      
      if (contentType === "explanation") {
        prompt = `شما یک معلم حرفه‌ای هستید. یک توضیح جامع و آموزشی برای موضوع زیر بنویسید:

درس: ${subject}
موضوع: ${topic}
پایه تحصیلی: ${grade}

محتوا باید شامل:
1. مقدمه جذاب و ساده
2. توضیح مفاهیم اصلی با مثال‌های کاربردی
3. نکات کلیدی و مهم
4. خلاصه و جمع‌بندی

از زبان ساده و مناسب پایه ${grade} استفاده کن. محتوا را به صورت HTML با تگ‌های <h3>، <p>، <ul>/<li>، <strong> بنویس.`;
      } else if (contentType === "activity") {
        prompt = `فعالیت‌های آموزشی و تمرین‌های عملی برای موضوع زیر طراحی کن:

درس: ${subject}
موضوع: ${topic}
پایه: ${grade}

5 فعالیت یا تمرین متنوع ارائه بده که شامل:
- فعالیت‌های فردی و گروهی
- تمرین‌های عملی
- پروژه‌های کوچک
- بازی‌های آموزشی

برای هر فعالیت هدف، مراحل اجرا و مواد لازم را مشخص کن. HTML با تگ‌های <h3>، <p>، <ol>/<li> بنویس.`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true
      });

      setGeneratedContent(result);
      toast.success("محتوا تولید شد");
    } catch (error) {
      console.error(error);
      toast.error("خطا در تولید محتوا");
    } finally {
      setLoading(false);
    }
  };

  const generateQuestions = async () => {
    if (!questionTopic || !grade) {
      toast.error("لطفاً موضوع و پایه را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const difficultyMap = {
        easy: "آسان",
        medium: "متوسط",
        hard: "دشوار"
      };

      const typeMap = {
        multiple_choice: "چهار گزینه‌ای",
        true_false: "درست/غلط",
        short_answer: "پاسخ کوتاه",
        essay: "تشریحی"
      };

      const prompt = `${questionCount} سوال ${typeMap[questionType]} با سطح دشواری ${difficultyMap[questionDifficulty]} برای موضوع "${questionTopic}" در پایه ${grade} بساز.

${questionType === "multiple_choice" ? "برای هر سوال 4 گزینه بده و پاسخ صحیح را مشخص کن." : ""}
${questionType === "true_false" ? "برای هر سوال پاسخ صحیح (درست/غلط) را مشخص کن." : ""}
${questionType === "short_answer" || questionType === "essay" ? "برای هر سوال یک پاسخ نمونه ارائه بده." : ""}

سوالات باید متنوع، آموزنده و مناسب سطح پایه باشند. خروجی را به صورت HTML با تگ‌های <h4>، <p>، <ul>/<li>، <strong> بنویس.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedContent(result);
      toast.success("سوالات تولید شدند");
    } catch (error) {
      console.error(error);
      toast.error("خطا در تولید سوالات");
    } finally {
      setLoading(false);
    }
  };

  const summarizeFile = async () => {
    if (!uploadedFile) {
      toast.error("لطفاً فایل را آپلود کنید");
      return;
    }

    setLoading(true);
    try {
      // Upload file first
      const uploadResult = await base44.integrations.Core.UploadFile({ file: uploadedFile });
      const fileUrl = uploadResult.file_url;

      const summaryMap = {
        brief: "خلاصه کوتاه و فشرده",
        detailed: "خلاصه تفصیلی با جزئیات",
        bullet_points: "نکات کلیدی به صورت bullet points"
      };

      const prompt = `این فایل آموزشی را بخوان و یک ${summaryMap[summaryType]} از آن ارائه بده.

خروجی باید شامل:
1. موضوع اصلی فایل
2. نکات کلیدی و مهم
3. مفاهیم اصلی
${summaryType === "detailed" ? "4. توضیحات تکمیلی" : ""}

خروجی را به صورت HTML با تگ‌های <h3>، <p>، <ul>/<li> بنویس.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [fileUrl],
        add_context_from_internet: false
      });

      setGeneratedContent(result);
      toast.success("خلاصه‌سازی انجام شد");
    } catch (error) {
      console.error(error);
      toast.error("خطا در خلاصه‌سازی فایل");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success("محتوا کپی شد");
  };

  const downloadAsHTML = () => {
    const blob = new Blob([generatedContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success("فایل دانلود شد");
  };

  const SUBJECTS = ["قرآن", "پیام‌های آسمان", "فارسی", "نگارش", "ریاضی", "علوم", "مطالعات اجتماعی", "فرهنگ و هنر", "عربی", "انگلیسی", "کار و فناوری", "تفکر و سبک زندگی", "آمادگی دفاعی"];
  const GRADES = ["هفتم", "هشتم", "نهم"];

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">تولید محتوای آموزشی با AI</h1>
            <p className="text-gray-300 text-lg mt-1">ایجاد محتوا، سوال، و خلاصه‌سازی منابع درسی</p>
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="clay-card grid w-full grid-cols-3">
          <TabsTrigger value="lesson" className="data-[state=active]:bg-purple-500/20">
            <FileText className="w-4 h-4 ml-2" />
            محتوای درسی
          </TabsTrigger>
          <TabsTrigger value="questions" className="data-[state=active]:bg-blue-500/20">
            <HelpCircle className="w-4 h-4 ml-2" />
            تولید سوال
          </TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-green-500/20">
            <BookOpen className="w-4 h-4 ml-2" />
            خلاصه‌سازی
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lesson" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="clay-card h-full">
                <CardHeader>
                  <CardTitle className="text-white">تنظیمات محتوای درسی</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">درس *</label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger className="clay-card text-white">
                        <SelectValue placeholder="انتخاب درس" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">موضوع درس *</label>
                    <Input
                      placeholder="مثال: اعداد اول، فعل ماضی، جنگ جهانی اول"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="clay-card text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">پایه تحصیلی *</label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger className="clay-card text-white">
                        <SelectValue placeholder="انتخاب پایه" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">نوع محتوا</label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="clay-card text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="explanation">توضیح و آموزش</SelectItem>
                        <SelectItem value="activity">فعالیت و تمرین</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={generateLessonContent}
                    disabled={loading}
                    className="w-full clay-button bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        در حال تولید...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        تولید محتوا
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

        {/* Output Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="clay-card h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">محتوای تولید شده</CardTitle>
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="clay-button text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={downloadAsHTML}
                      className="clay-button text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {generatedContent ? (
                <div className="flex-1 bg-slate-900/50 rounded-xl p-4 overflow-y-auto custom-scrollbar">
                  <div 
                    className="text-gray-200 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>محتوای شما اینجا نمایش داده می‌شود</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="clay-card h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">محتوای تولید شده</CardTitle>
                    {generatedContent && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={copyToClipboard} className="clay-button text-white">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={downloadAsHTML} className="clay-button text-white">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {generatedContent ? (
                    <div className="flex-1 bg-slate-900/50 rounded-xl p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                      <div className="text-gray-200 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent }} />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>محتوای شما اینجا نمایش داده می‌شود</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="clay-card h-full">
                <CardHeader>
                  <CardTitle className="text-white">تنظیمات تولید سوال</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">موضوع سوالات *</label>
                    <Input
                      placeholder="مثال: جنگ جهانی دوم، فعل، معادلات درجه دوم"
                      value={questionTopic}
                      onChange={(e) => setQuestionTopic(e.target.value)}
                      className="clay-card text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">پایه تحصیلی *</label>
                    <Select value={grade} onValueChange={setGrade}>
                      <SelectTrigger className="clay-card text-white">
                        <SelectValue placeholder="انتخاب پایه" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">نوع سوال</label>
                    <Select value={questionType} onValueChange={setQuestionType}>
                      <SelectTrigger className="clay-card text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple_choice">چهار گزینه‌ای</SelectItem>
                        <SelectItem value="true_false">درست/غلط</SelectItem>
                        <SelectItem value="short_answer">پاسخ کوتاه</SelectItem>
                        <SelectItem value="essay">تشریحی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">تعداد سوالات</label>
                      <Select value={questionCount} onValueChange={setQuestionCount}>
                        <SelectTrigger className="clay-card text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 سوال</SelectItem>
                          <SelectItem value="5">5 سوال</SelectItem>
                          <SelectItem value="10">10 سوال</SelectItem>
                          <SelectItem value="15">15 سوال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">سطح دشواری</label>
                      <Select value={questionDifficulty} onValueChange={setQuestionDifficulty}>
                        <SelectTrigger className="clay-card text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">آسان</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="hard">دشوار</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={generateQuestions} disabled={loading} className="w-full clay-button bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        در حال تولید...
                      </>
                    ) : (
                      <>
                        <HelpCircle className="mr-2 h-5 w-5" />
                        تولید سوالات
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="clay-card h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">سوالات تولید شده</CardTitle>
                    {generatedContent && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={copyToClipboard} className="clay-button text-white">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={downloadAsHTML} className="clay-button text-white">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {generatedContent ? (
                    <div className="flex-1 bg-slate-900/50 rounded-xl p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                      <div className="text-gray-200 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent }} />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>سوالات شما اینجا نمایش داده می‌شوند</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="clay-card h-full">
                <CardHeader>
                  <CardTitle className="text-white">خلاصه‌سازی منابع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">آپلود فایل درسی *</label>
                    <div className="clay-card p-4">
                      <Input
                        type="file"
                        onChange={(e) => setUploadedFile(e.target.files[0])}
                        className="clay-card text-white"
                        accept=".pdf,.doc,.docx,.txt"
                      />
                      {uploadedFile && (
                        <p className="text-green-400 text-sm mt-2">
                          ✓ {uploadedFile.name}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      فرمت‌های پشتیبانی: PDF, Word, TXT
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">نوع خلاصه</label>
                    <Select value={summaryType} onValueChange={setSummaryType}>
                      <SelectTrigger className="clay-card text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brief">خلاصه کوتاه</SelectItem>
                        <SelectItem value="detailed">خلاصه تفصیلی</SelectItem>
                        <SelectItem value="bullet_points">نکات کلیدی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="clay-card p-4 bg-blue-900/20 border border-blue-500/30">
                    <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      چگونه استفاده کنیم؟
                    </h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      <li>• فایل PDF یا Word درس را آپلود کنید</li>
                      <li>• نوع خلاصه مورد نظر را انتخاب کنید</li>
                      <li>• AI محتوا را تحلیل و خلاصه می‌کند</li>
                    </ul>
                  </div>

                  <Button onClick={summarizeFile} disabled={loading} className="w-full clay-button bg-gradient-to-r from-green-500 to-teal-500 text-white">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        در حال خلاصه‌سازی...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-5 w-5" />
                        خلاصه‌سازی فایل
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="clay-card h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">خلاصه تولید شده</CardTitle>
                    {generatedContent && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={copyToClipboard} className="clay-button text-white">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={downloadAsHTML} className="clay-button text-white">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {generatedContent ? (
                    <div className="flex-1 bg-slate-900/50 rounded-xl p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                      <div className="text-gray-200 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent }} />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>خلاصه فایل اینجا نمایش داده می‌شود</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
      </Tabs>

      {generatedContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white">پیش‌نمایش وب‌سایت</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-xl p-8 shadow-2xl">
                <div 
                  className="text-gray-800 prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: generatedContent }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}