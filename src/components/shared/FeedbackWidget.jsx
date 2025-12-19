import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareWarning, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("bug");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const response = await base44.functions.invoke("submitFeedback", {
        type,
        message,
        pageUrl: window.location.href
      });

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.email_sent === false) {
          toast.warning("بازخورد شما ذخیره شد، اما ارسال ایمیل با خطا مواجه شد.");
      } else {
          toast.success("بازخورد شما با موفقیت ثبت و به تیم پشتیبانی ایمیل شد.");
      }
      setIsOpen(false);
      setMessage("");
      setType("bug");
    } catch (error) {
      console.error("Feedback error:", error);
      toast.error("خطا در ارسال بازخورد. لطفا بعدا تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-4 left-4 z-50 rounded-full shadow-lg bg-red-600 hover:bg-red-700 text-white w-12 h-12 p-0 md:w-auto md:h-auto md:px-4 md:py-2 transition-all duration-300 hover:scale-105 border-2 border-red-400"
          title="گزارش مشکل / پیشنهاد"
        >
          <MessageSquareWarning className="w-6 h-6 md:mr-2" />
          <span className="hidden md:inline font-bold">گزارش مشکل / پیشنهاد</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageSquareWarning className="text-red-500 w-6 h-6" />
            ارسال بازخورد
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            مشکلات، پیشنهادات یا انتقادات خود را با ما در میان بگذارید. پیام شما مستقیماً برای تیم پشتیبانی ارسال می‌شود.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">نوع بازخورد</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                <SelectItem value="bug">🐛 گزارش باگ / مشکل فنی</SelectItem>
                <SelectItem value="suggestion">💡 پیشنهاد ویژگی جدید</SelectItem>
                <SelectItem value="criticism">💭 انتقاد / نظر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">توضیحات</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="لطفا توضیحات کامل را اینجا بنویسید..."
              className="min-h-[120px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              انصراف
            </Button>
            <Button
              type="submit"
              disabled={loading || !message.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  ارسال بازخورد
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}