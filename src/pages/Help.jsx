import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HelpCircle, BookOpen, Rocket, Trophy, Star, Zap, Target,
  ChevronDown, ChevronUp, Play, CheckCircle, Users, FileText,
  MessageCircle, Award, Flame, Crown, Gift, TrendingUp, Lock,
  Unlock, Clock, Medal, GraduationCap, Settings, Edit, BarChart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tutorialSections = {
  student: [
    {
      id: "dashboard",
      title: "داشبورد",
      icon: BarChart,
      color: "from-blue-500 to-blue-600",
      description: "نمای کلی از وضعیت تحصیلی شما",
      steps: [
        "در داشبورد می‌توانید خلاصه‌ای از وضعیت خود را ببینید",
        "تعداد سکه‌ها، سطح فعلی و میانگین نمرات نمایش داده می‌شود",
        "تکالیف آینده با مهلت تحویل نشان داده می‌شوند",
        "نشان‌های اخیر کسب شده را می‌بینید"
      ]
    },
    {
      id: "assignments",
      title: "تکالیف",
      icon: BookOpen,
      color: "from-green-500 to-green-600",
      description: "مشاهده و ارسال تکالیف",
      steps: [
        "لیست تمام تکالیف پایه تحصیلی شما نمایش داده می‌شود",
        "با کلیک روی هر تکلیف، جزئیات آن را می‌بینید",
        "می‌توانید پاسخ متنی بنویسید یا فایل آپلود کنید",
        "پس از ارسال، منتظر نمره‌دهی معلم باشید",
        "با ارسال به موقع، سکه و XP بیشتری کسب می‌کنید!"
      ]
    },
    {
      id: "learning-paths",
      title: "مسیرهای یادگیری",
      icon: Rocket,
      color: "from-purple-500 to-purple-600",
      description: "یادگیری گام به گام با پاداش",
      steps: [
        "مسیرهای یادگیری شامل چند مرحله هستند: درس، آزمون، تکلیف و چالش",
        "هر مرحله را که تکمیل کنید، مرحله بعدی باز می‌شود 🔓",
        "با تکمیل هر مرحله XP و سکه کسب می‌کنید",
        "آزمون‌ها دارای سوالات چندگزینه‌ای هستند",
        "برای قبولی باید حداقل نمره تعیین شده را بگیرید",
        "با تکمیل کل مسیر، پاداش ویژه دریافت می‌کنید! 🎁"
      ]
    },
    {
      id: "achievements",
      title: "دستاوردها و نشان‌ها",
      icon: Trophy,
      color: "from-yellow-500 to-orange-500",
      description: "کسب نشان و پیگیری پیشرفت",
      steps: [
        "با انجام فعالیت‌های مختلف نشان کسب کنید",
        "نشان «اولین قدم» با ارسال اولین تکلیف",
        "نشان «نمره کامل» با گرفتن نمره ۲۰",
        "نشان «هفته فعال» با ۷ روز فعالیت متوالی",
        "نشان «قهرمان» با کسب ۱۰۰۰ سکه",
        "روی هر نشان کلیک کنید تا جزئیات را ببینید"
      ]
    },
    {
      id: "levels",
      title: "سیستم سطح‌بندی",
      icon: Star,
      color: "from-indigo-500 to-purple-500",
      description: "پیشرفت و ارتقای سطح",
      steps: [
        "با کسب سکه، سطح شما بالا می‌رود",
        "هر سطح نیاز به XP بیشتری دارد",
        "رده‌های مختلف: تازه‌کار، مبتدی، یادگیرنده، پیشرفته، حرفه‌ای...",
        "بالاترین رده «اسطوره» است! 👑",
        "سطح بالاتر = اعتبار بیشتر در تابلوی امتیازات"
      ]
    },
    {
      id: "streak",
      title: "فعالیت مستمر",
      icon: Flame,
      color: "from-orange-500 to-red-500",
      description: "روزهای متوالی فعالیت",
      steps: [
        "هر روز که تکلیف ارسال کنید، استریک شما ادامه می‌یابد",
        "۳ روز متوالی = نشان «شروع خوب»",
        "۷ روز متوالی = نشان «هفته فعال» 🔥",
        "۳۰ روز متوالی = نشان «ماه درخشان»",
        "فعالیت هفتگی در صفحه دستاوردها نمایش داده می‌شود"
      ]
    },
    {
      id: "scoreboard",
      title: "تابلوی امتیازات",
      icon: Crown,
      color: "from-amber-500 to-yellow-500",
      description: "رقابت با همکلاسی‌ها",
      steps: [
        "رتبه‌بندی بر اساس سکه، میانگین نمره و تعداد تکلیف",
        "می‌توانید فقط همکلاسی‌های پایه خود را ببینید",
        "رتبه اول هر هفته نشان «قهرمان هفته» می‌گیرد",
        "سه نفر برتر با مدال طلا، نقره و برنز مشخص می‌شوند"
      ]
    },
    {
      id: "yara",
      title: "یارا - دستیار هوشمند",
      icon: MessageCircle,
      color: "from-cyan-500 to-blue-500",
      description: "کمک هوشمند در یادگیری",
      steps: [
        "یارا یک دستیار هوش مصنوعی است",
        "می‌توانید سوالات درسی بپرسید",
        "در تنظیمات، سطح جزئیات و لحن یارا را تغییر دهید",
        "یارا می‌تواند در حل تمرینات کمک کند"
      ]
    }
  ],
  teacher: [
    {
      id: "dashboard",
      title: "داشبورد معلم",
      icon: BarChart,
      color: "from-blue-500 to-blue-600",
      description: "نمای کلی از کلاس",
      steps: [
        "تعداد تکالیف، دانش‌آموزان و ارسال‌های در انتظار",
        "لیست تکالیف منتظر نمره‌دهی",
        "دسترسی سریع به بخش‌های مختلف"
      ]
    },
    {
      id: "assignments",
      title: "مدیریت تکالیف",
      icon: FileText,
      color: "from-green-500 to-green-600",
      description: "ایجاد و نمره‌دهی تکالیف",
      steps: [
        "با دکمه «تکلیف جدید» تکلیف بسازید",
        "عنوان، توضیحات، مهلت و نمره را تعیین کنید",
        "پاداش سکه برای دانش‌آموزان مشخص کنید",
        "برای نمره‌دهی روی «مشاهده ارسال‌ها» کلیک کنید",
        "نمره و بازخورد را وارد کرده و ذخیره کنید"
      ]
    },
    {
      id: "learning-paths",
      title: "ساخت مسیر یادگیری",
      icon: Rocket,
      color: "from-purple-500 to-purple-600",
      description: "طراحی مسیرهای گیمیفای",
      steps: [
        "۱. روی «مسیر جدید» کلیک کنید",
        "۲. عنوان، درس، پایه و سطح دشواری را انتخاب کنید",
        "۳. پاداش تکمیل مسیر (سکه) را تعیین کنید",
        "۴. مسیر را ذخیره کنید",
        "۵. با «افزودن مرحله» مراحل را بسازید",
        "انواع مراحل: درس (محتوای متنی)، آزمون، تکلیف، چالش",
        "برای آزمون‌ها باید سوالات را جداگانه تعریف کنید"
      ]
    },
    {
      id: "quiz-creation",
      title: "ساخت آزمون",
      icon: Target,
      color: "from-orange-500 to-red-500",
      description: "طراحی سوالات چندگزینه‌ای",
      steps: [
        "ابتدا یک مرحله از نوع «آزمون» بسازید",
        "سپس در بخش Quiz، سوالات را اضافه کنید",
        "هر سوال شامل: متن سوال، گزینه‌ها و پاسخ صحیح",
        "می‌توانید محدودیت زمانی تعیین کنید",
        "حداقل نمره قبولی را مشخص کنید (مثلاً ۶۰٪)"
      ]
    },
    {
      id: "reports",
      title: "گزارش‌های عملکرد",
      icon: TrendingUp,
      color: "from-teal-500 to-green-500",
      description: "تحلیل عملکرد دانش‌آموزان",
      steps: [
        "میانگین نمرات کلاس را ببینید",
        "عملکرد هر دانش‌آموز را بررسی کنید",
        "نمودار پیشرفت در طول زمان",
        "شناسایی دانش‌آموزان نیازمند کمک"
      ]
    }
  ]
};

function TutorialCard({ section, isExpanded, onToggle }) {
  const Icon = section.icon;
  
  return (
    <motion.div layout>
      <Card className="clay-card overflow-hidden">
        <div 
          className="p-4 cursor-pointer hover:bg-gray-800/30 transition"
          onClick={onToggle}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{section.title}</h3>
              <p className="text-sm text-gray-400">{section.description}</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-700"
            >
              <div className="p-4 bg-gray-800/30">
                <div className="space-y-3">
                  {section.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-white font-bold">{index + 1}</span>
                      </div>
                      <p className="text-gray-300">{step}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function Help() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeTab, setActiveTab] = useState("basics");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const isTeacher = user?.student_role === "teacher";
  const isAdmin = user?.student_role === "admin";
  const sections = isTeacher ? tutorialSections.teacher : tutorialSections.student;

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">راهنما و آموزش</h1>
        <p className="text-gray-400">همه چیز درباره استفاده از دانش‌آموزیار</p>
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="clay-card p-6 mb-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          نکات سریع
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="clay-card p-4 bg-green-900/30 text-center">
            <Gift className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">با ارسال زودهنگام تکالیف سکه بیشتری بگیرید!</p>
          </div>
          <div className="clay-card p-4 bg-orange-900/30 text-center">
            <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">هر روز فعالیت کنید تا استریک نشکند!</p>
          </div>
          <div className="clay-card p-4 bg-purple-900/30 text-center">
            <Rocket className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">مسیرهای یادگیری را تکمیل کنید!</p>
          </div>
        </div>
      </motion.div>

      {/* Gamification Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="clay-card p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          سیستم گیمیفیکیشن
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5" />
              سکه (Coins)
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                ارسال تکلیف: ۱۰-۲۰ سکه
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                نمره ۲۰: ۵۰ سکه اضافی
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                تکمیل مرحله مسیر: ۱۰-۵۰ سکه
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                تکمیل کل مسیر: ۱۰۰+ سکه
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-yellow-300 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              تجربه (XP)
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                XP برای ارتقای سطح استفاده می‌شود
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                هر سطح نیاز به XP بیشتری دارد
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                از درس و آزمون XP بگیرید
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                سطح بالاتر = رتبه بهتر
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Tutorial Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          آموزش‌های تفصیلی
        </h2>

        <div className="space-y-4">
          {sections.map((section) => (
            <TutorialCard
              key={section.id}
              section={section}
              isExpanded={expandedSection === section.id}
              onToggle={() => setExpandedSection(
                expandedSection === section.id ? null : section.id
              )}
            />
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-green-400" />
          سوالات متداول
        </h2>

        <div className="space-y-3">
          <Card className="clay-card">
            <CardContent className="p-4">
              <h3 className="font-bold text-white mb-2">چرا مرحله بعدی قفل است؟</h3>
              <p className="text-gray-400 text-sm">
                برای باز شدن مرحله بعدی، باید مرحله فعلی را با موفقیت تکمیل کنید. 
                در آزمون‌ها باید حداقل نمره قبولی را کسب کنید.
              </p>
            </CardContent>
          </Card>

          <Card className="clay-card">
            <CardContent className="p-4">
              <h3 className="font-bold text-white mb-2">چگونه سکه بیشتری کسب کنم؟</h3>
              <p className="text-gray-400 text-sm">
                تکالیف را به موقع ارسال کنید، نمره بالا بگیرید، مسیرهای یادگیری را تکمیل کنید 
                و فعالیت روزانه داشته باشید.
              </p>
            </CardContent>
          </Card>

          <Card className="clay-card">
            <CardContent className="p-4">
              <h3 className="font-bold text-white mb-2">استریک چیست؟</h3>
              <p className="text-gray-400 text-sm">
                استریک تعداد روزهای متوالی است که فعالیت داشته‌اید. 
                اگر یک روز فعالیت نکنید، استریک صفر می‌شود!
              </p>
            </CardContent>
          </Card>

          {isTeacher && (
            <Card className="clay-card">
              <CardContent className="p-4">
                <h3 className="font-bold text-white mb-2">چگونه سوالات آزمون بسازم؟</h3>
                <p className="text-gray-400 text-sm">
                  ابتدا مسیر یادگیری بسازید، سپس مرحله‌ای از نوع «آزمون» اضافه کنید. 
                  بعد از ذخیره، می‌توانید سوالات را در بخش Quiz تعریف کنید.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="clay-card p-6 mt-8 text-center bg-gradient-to-r from-blue-900/50 to-purple-900/50"
      >
        <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">هنوز سوالی دارید؟</h3>
        <p className="text-gray-400 mb-4">از یارا بپرسید یا با معلم خود صحبت کنید</p>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <MessageCircle className="w-4 h-4 ml-2" />
          گفتگو با یارا
        </Button>
      </motion.div>
    </div>
  );
}