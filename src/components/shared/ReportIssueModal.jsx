import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function ReportIssueModal({ isOpen, onClose, user }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        type: "bug", // bug, suggestion, criticism
        message: "",
        contact: ""
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const typeLabels = {
                bug: "گزارش مشکل / باگ",
                suggestion: "پیشنهاد",
                criticism: "انتقاد"
            };

            const response = await base44.functions.invoke('sendReportEmail', {
                type: typeLabels[formData.type],
                message: formData.message,
                contact: formData.contact
            });

            if (response.data && response.data.error) {
                throw new Error(response.data.error);
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({ type: "bug", message: "", contact: "" });
                onClose();
            }, 2000);

        } catch (error) {
            console.error("Error sending report:", error);
            toast.error("خطا در ارسال گزارش. لطفا دوباره تلاش کنید.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <AlertCircle className="w-6 h-6" />
                                گزارش مشکل یا پیشنهاد
                            </h2>
                            <p className="text-red-100 text-sm mt-1 opacity-90">
                                نظرات شما به ما کمک می‌کند تا بهتر شویم.
                            </p>
                        </div>

                        <div className="p-6">
                            {success ? (
                                <div className="py-10 text-center space-y-4">
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
                                        <CheckCircle2 className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">دریافت شد!</h3>
                                    <p className="text-gray-400">با تشکر از بازخورد شما.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">موضوع</Label>
                                        <Select 
                                            value={formData.type} 
                                            onValueChange={(val) => setFormData({...formData, type: val})}
                                        >
                                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                <SelectItem value="bug">🐛 گزارش مشکل فنی (باگ)</SelectItem>
                                                <SelectItem value="suggestion">💡 پیشنهاد ویژگی جدید</SelectItem>
                                                <SelectItem value="criticism">💭 انتقاد و شکایت</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-300">متن پیام <span className="text-red-500">*</span></Label>
                                        <Textarea 
                                            required
                                            placeholder="لطفا توضیحات کامل را اینجا بنویسید..."
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-300">شماره تماس یا ایمیل (اختیاری)</Label>
                                        <Input 
                                            placeholder="برای پیگیری (اختیاری)"
                                            value={formData.contact}
                                            onChange={(e) => setFormData({...formData, contact: e.target.value})}
                                            className="bg-slate-800 border-slate-700 text-white"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            onClick={onClose}
                                            className="flex-1 text-gray-400 hover:text-white hover:bg-slate-800"
                                        >
                                            انصراف
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={loading}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    ارسال بازخورد
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}