import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function ContentGenerator() {
  const [schoolName, setSchoolName] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);

  const generateContent = async () => {
    if (!schoolName.trim()) {
      toast.error("لطفاً نام مدرسه را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const prompt = `شما یک نویسنده محتوای حرفه‌ای هستید. یک متن "درباره ما" برای وب‌سایت مدرسه بنویسید.

نام مدرسه: ${schoolName}
${additionalInfo ? `اطلاعات تکمیلی: ${additionalInfo}` : ''}

متن باید شامل موارد زیر باشد:
1. معرفی کوتاه و جذاب مدرسه
2. چشم‌انداز و اهداف آموزشی
3. نقاط قوت و تمایزات مدرسه
4. تعهد به آموزش کیفی و پرورش دانش‌آموزان
5. لحن رسمی اما دوستانه

متن را به صورت HTML ساده با تگ‌های <h2>، <p>، <ul>/<li> بنویس تا قابل استفاده در وب‌سایت باشد.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedContent(result);
      toast.success("محتوا با موفقیت تولید شد");
    } catch (error) {
      console.error("خطا در تولید محتوا:", error);
      toast.error("خطا در تولید محتوا");
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
    a.download = 'about-us.html';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success("فایل دانلود شد");
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
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
            <h1 className="text-4xl font-bold text-white">تولید محتوای هوشمند</h1>
            <p className="text-gray-300 text-lg mt-1">ایجاد محتوای حرفه‌ای برای وب‌سایت مدرسه</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="clay-card h-full">
            <CardHeader>
              <CardTitle className="text-white">اطلاعات ورودی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">نام مدرسه *</label>
                <Input
                  placeholder="مثال: دبیرستان هوشمند فردا"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="clay-card text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  اطلاعات تکمیلی (اختیاری)
                </label>
                <Textarea
                  placeholder="مثال: مدرسه ما از سال 1380 فعالیت دارد و در زمینه علوم و ریاضیات پیشرو است..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  className="clay-card text-white min-h-[150px]"
                />
              </div>

              <Button
                onClick={generateContent}
                disabled={loading}
                className="w-full clay-button bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    در حال تولید محتوا...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    تولید محتوا با AI
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
      </div>

      {/* Preview Section */}
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