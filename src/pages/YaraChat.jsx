import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User as UserIcon, Sparkles, Settings, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianTimeAgo, toPersianNumber } from "@/components/utils";

export default function YaraChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [yaraSettings, setYaraSettings] = useState({
    detail_level: "moderate",
    tone: "friendly",
    language_style: "simple"
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Load Yara settings
      const settings = await base44.entities.YaraSettings.filter({ user_id: user.id });
      if (settings.length > 0) {
        setYaraSettings(settings[0]);
      }
      
      const chatHistory = await base44.entities.ChatMessage.filter({ user_id: user.id }, "-created_date");
      setMessages(chatHistory);

      if (chatHistory.length === 0) {
        const welcomeMessage = {
          id: "welcome",
          message: `سلام ${user.full_name || "دوست عزیز"}! 🌟\n\nمن یارا هستم، دستیار هوشمند شما! آماده‌ام تا در مسیر یادگیری کمکتان کنم.\n\n✨ می‌تونم کمکتون کنم:\n• راهنمایی برای حل تکالیف\n• توضیح مفاهیم درسی\n• ایجاد برنامه مطالعه\n• تحلیل عملکرد و پیشرفت\n• انگیزه‌بخشی و پشتیبانی\n\nچطور می‌تونم کمکتون کنم؟`,
          is_from_user: false,
          created_date: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("خطا در بارگیری چت:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now() + "_user",
      message: inputMessage,
      is_from_user: true,
      created_date: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      // جمع‌آوری اطلاعات کامل از سیستم
      let contextData = "";
      
      if (currentUser.student_role === "student" && currentUser.grade) {
        const assignments = await base44.entities.Assignment.filter({ grade: currentUser.grade });
        const submissions = await base44.entities.Submission.filter({ student_id: currentUser.id });
        const gradedSubs = submissions.filter(s => s.score !== null);
        const avgScore = gradedSubs.length > 0 
          ? (gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length).toFixed(1)
          : 0;
        
        contextData = `
اطلاعات دانش‌آموز:
- پایه: ${currentUser.grade}
- تعداد تکالیف ارسال شده: ${submissions.length}
- میانگین نمرات: ${avgScore}
- سکه‌ها: ${currentUser.coins || 0}
- سطح: ${currentUser.level || 1}

تکالیف فعلی:
${assignments.slice(0, 5).map(a => `- ${a.title} (${a.subject}) - مهلت: ${a.due_date || 'نامشخص'}`).join('\n')}
`;
      } else if (currentUser.student_role === "teacher") {
        const teacherAssignments = await base44.entities.Assignment.filter({ 
          teacher_id: currentUser.id,
          grade: currentUser.grade,
          subject: currentUser.subject 
        });
        const allSubmissions = await base44.entities.Submission.list();
        const relevantSubmissions = allSubmissions.filter(s => 
          teacherAssignments.some(a => a.id === s.assignment_id)
        );
        const students = await base44.entities.PublicProfile.filter({ 
          grade: currentUser.grade, 
          student_role: "student" 
        });
        
        // تحلیل عملکرد دانش‌آموزان
        const studentPerformance = students.map(student => {
          const studentSubs = relevantSubmissions.filter(s => s.student_id === student.user_id);
          const gradedSubs = studentSubs.filter(s => s.score !== null);
          const avg = gradedSubs.length > 0 
            ? (gradedSubs.reduce((sum, s) => sum + s.score, 0) / gradedSubs.length).toFixed(1)
            : 0;
          return { name: student.display_name || student.full_name, avg, count: gradedSubs.length };
        });
        
        const weakStudents = studentPerformance.filter(s => s.avg < 10 && s.count > 0);
        const strongStudents = studentPerformance.filter(s => s.avg >= 15);
        
        contextData = `
اطلاعات معلم:
- درس: ${currentUser.subject}
- پایه: ${currentUser.grade}
- تعداد تکالیف: ${teacherAssignments.length}
- تعداد دانش‌آموزان: ${students.length}
- تعداد ارسالی‌ها: ${relevantSubmissions.length}

دانش‌آموزان ضعیف (نمره زیر 10):
${weakStudents.length > 0 ? weakStudents.map(s => `- ${s.name}: میانگین ${s.avg}`).join('\n') : 'ندارد'}

دانش‌آموزان قوی (نمره بالای 15):
${strongStudents.length > 0 ? strongStudents.slice(0, 5).map(s => `- ${s.name}: میانگین ${s.avg}`).join('\n') : 'ندارد'}
`;
      }

      // تعیین لحن و سطح جزئیات بر اساس تنظیمات
      const tonePrompts = {
        friendly: "با لحن بسیار دوستانه و صمیمی",
        professional: "با لحن حرفه‌ای و رسمی اما گرم",
        motivational: "با لحن انگیزشی و پرانرژی"
      };
      
      const detailPrompts = {
        brief: "پاسخ کوتاه و مختصر بده (حداکثر 3 خط)",
        moderate: "پاسخ متوسط و جامع بده",
        detailed: "پاسخ کامل و مفصل با جزئیات و مثال‌های بیشتر بده"
      };

      const stylePrompts = {
        simple: "از زبان ساده و روزمره استفاده کن",
        formal: "از زبان رسمی و ادبی استفاده کن"
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `
تو یارا هستی، یک دستیار آموزشی هوشمند. به زبان فارسی پاسخ بده و این قوانین را رعایت کن:

**قوانین اصلی:**
1. هرگز پاسخ مستقیم تکلیف نده، فقط راهنمایی و روش حل را توضیح بده
2. از ایموجی مناسب استفاده کن
3. روش‌های یادگیری و تکنیک‌های مطالعه پیشنهاد بده
4. در تحلیل داده‌ها دقیق و آماری باش
5. برای سوالات معلم، تحلیل‌های آماری و پیشنهادات عملی ارائه بده

**تنظیمات پاسخ:**
- لحن: ${tonePrompts[yaraSettings.tone]}
- سطح جزئیات: ${detailPrompts[yaraSettings.detail_level]}
- سبک زبان: ${stylePrompts[yaraSettings.language_style]}

**اطلاعات موجود در سیستم:**
${contextData}

**پیام کاربر:** "${inputMessage}"

پاسخ:
        `
      });

      const yaraResponse = {
        id: Date.now() + "_yara",
        message: response,
        is_from_user: false,
        created_date: new Date().toISOString()
      };

      setMessages(prev => [...prev, yaraResponse]);

      await base44.entities.ChatMessage.create({
        user_id: currentUser.id,
        message: inputMessage,
        is_from_user: true,
        response: response
      });

    } catch (error) {
      console.error("خطا در ارسال پیام:", error);
      const errorMessage = {
        id: Date.now() + "_error",
        message: "متاسفم، مشکلی پیش آمده. لطفا دوباره تلاش کنید. 😔",
        is_from_user: false,
        created_date: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveSettings = async () => {
    try {
      const existingSettings = await base44.entities.YaraSettings.filter({ user_id: currentUser.id });
      
      const settingsData = {
        user_id: currentUser.id,
        detail_level: yaraSettings.detail_level,
        tone: yaraSettings.tone,
        language_style: yaraSettings.language_style
      };
      
      if (existingSettings.length > 0) {
        await base44.entities.YaraSettings.update(existingSettings[0].id, settingsData);
      } else {
        await base44.entities.YaraSettings.create(settingsData);
      }
      
      setShowSettings(false);
    } catch (error) {
      console.error("خطا در ذخیره تنظیمات:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="clay-card p-6 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                یارا - دستیار هوشمند 
                <Sparkles className="w-6 h-6 text-purple-400" />
              </h1>
              <p className="text-gray-300">همراه شما در مسیر یادگیری</p>
            </div>
          </div>
          <Button
            onClick={() => setShowSettings(true)}
            className="clay-button bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          >
            <Settings className="w-5 h-5 mr-2" />
            تنظیمات
          </Button>
        </div>
      </motion.div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="clay-card p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-purple-400" />
                  تنظیمات یارا
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setShowSettings(false)}
                  className="clay-button"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    سطح جزئیات پاسخ‌ها
                  </label>
                  <Select 
                    value={yaraSettings.detail_level} 
                    onValueChange={(value) => setYaraSettings({...yaraSettings, detail_level: value})}
                  >
                    <SelectTrigger className="clay-card text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief">مختصر و کوتاه</SelectItem>
                      <SelectItem value="moderate">متوسط</SelectItem>
                      <SelectItem value="detailed">کامل و مفصل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    لحن یارا
                  </label>
                  <Select 
                    value={yaraSettings.tone} 
                    onValueChange={(value) => setYaraSettings({...yaraSettings, tone: value})}
                  >
                    <SelectTrigger className="clay-card text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">دوستانه و صمیمی</SelectItem>
                      <SelectItem value="professional">حرفه‌ای</SelectItem>
                      <SelectItem value="motivational">انگیزشی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    سبک زبان
                  </label>
                  <Select 
                    value={yaraSettings.language_style} 
                    onValueChange={(value) => setYaraSettings({...yaraSettings, language_style: value})}
                  >
                    <SelectTrigger className="clay-card text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">ساده و روزمره</SelectItem>
                      <SelectItem value="formal">رسمی و ادبی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="outline"
                    className="flex-1 clay-button text-white"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={saveSettings}
                    className="flex-1 clay-button bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    ذخیره تنظیمات
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 clay-card p-6 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.is_from_user ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`p-3 rounded-full ${message.is_from_user ? 'bg-purple-900/50' : 'bg-gray-700'}`}>
                  {message.is_from_user ? (
                    <UserIcon className="w-6 h-6 text-purple-400" />
                  ) : (
                    <Bot className="w-6 h-6 text-pink-400" />
                  )}
                </div>
                
                <div className={`flex-1 clay-card p-4 max-w-[85%] ${message.is_from_user ? 'bg-purple-900/50' : 'bg-pink-900/50'}`}>
                  <div className={`text-sm font-medium mb-2 ${message.is_from_user ? 'text-purple-400' : 'text-pink-400'}`}>
                    {message.is_from_user ? 'شما' : 'یارا'}
                  </div>
                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                    {message.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-left">
                    {toPersianTimeAgo(message.created_date)}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="p-3 rounded-full bg-gray-700">
                <Bot className="w-6 h-6 text-pink-400" />
              </div>
              <div className="flex-1 clay-card p-4 bg-pink-900/50">
                <div className="text-sm font-medium mb-2 text-pink-400">یارا</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-3 pt-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 clay-card border-0 text-lg p-4 bg-gray-800/70 text-white"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !inputMessage.trim()}
            className="clay-button px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}