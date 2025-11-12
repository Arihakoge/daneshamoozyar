import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianTimeAgo } from "@/components/utils";

export default function YaraChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
      
      const chatHistory = await base44.entities.ChatMessage.filter({ user_id: user.id }, "-created_date");
      setMessages(chatHistory);

      if (chatHistory.length === 0) {
        const welcomeMessage = {
          id: "welcome",
          message: `سلام ${user.full_name || "دوست عزیز"}! 🌟\n\nمن یارا هستم، دستیار هوشمند شما! آماده‌ام تا در مسیر یادگیری کمکتان کنم.\n\n✨ می‌تونم کمکتون کنم:\n• راهنمایی برای حل تکالیف\n• توضیح مفاهیم درسی\n• ایجاد برنامه مطالعه\n• انگیزه‌بخشی و پشتیبانی\n\nچطور می‌تونم کمکتون کنم؟`,
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
      const userAssignments = currentUser?.grade 
        ? await base44.entities.Assignment.filter({ grade: currentUser.grade }) 
        : [];

      const contextInfo = userAssignments.length > 0 
        ? `\n\nاطلاعات تکالیف کاربر:\n${userAssignments.map(a => `- ${a.title} (${a.subject})`).join('\n')}`
        : "";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `
تو یارا هستی، یک دستیار آموزشی دوستانه و هوشمند. باید به زبان فارسی پاسخ بدی و این قوانین رو رعایت کنی:

1. هرگز پاسخ مستقیم تکلیف نده، فقط راهنمایی کن
2. با لحن دوستانه و انگیزه‌بخش صحبت کن
3. از ایموجی استفاده کن
4. روش‌های یادگیری و تکنیک‌های مطالعه پیشنهاد بده
5. اگر سوال درباره تکلیف خاص بود، به جای جواب دادن، روش حل را توضیح بده

پیام کاربر: "${inputMessage}"
${contextInfo}

پاسخ با لحن دوستانه و راهنما:
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

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="clay-card p-6 mb-4"
      >
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
      </motion.div>

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