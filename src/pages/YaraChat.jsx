import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User as UserIcon, Sparkles, Settings, X, Plus, MessageSquare, Trash2, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianTimeAgo } from "@/components/utils";

export default function YaraChat() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [yaraSettings, setYaraSettings] = useState({
    detail_level: "moderate",
    tone: "friendly",
    language_style: "simple"
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initialize = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // Load settings
      const settings = await base44.entities.YaraSettings.filter({ user_id: user.id });
      if (settings.length > 0) setYaraSettings(settings[0]);

      // Load conversations
      const userConversations = await base44.entities.YaraConversation.filter({ user_id: user.id }, "-updated_date");
      setConversations(userConversations);

      if (userConversations.length > 0) {
        selectConversation(userConversations[0]);
      } else {
        createNewConversation(false);
      }
    } catch (error) {
      console.error("Error initializing Yara:", error);
    }
  };

  const createNewConversation = async (setActive = true) => {
    // If we're already in a new empty conversation, don't create another one
    if (currentConversation && !currentConversation.id && messages.length === 0) return;

    // Reset current conversation state to "new"
    const newConv = { id: null, title: "مکالمه جدید", messages: [] };
    if (setActive) {
        setCurrentConversation(newConv);
        setMessages([]);
        if (window.innerWidth < 768) setSidebarOpen(false);
    }
    return newConv;
  };

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    setLoading(true);
    try {
      const msgs = await base44.entities.YaraMessage.filter({ conversation_id: conversation.id }, "created_date");
      setMessages(msgs);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
    setLoading(false);
  };

  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("آیا از حذف این مکالمه مطمئن هستید؟")) return;
    
    try {
      await base44.entities.YaraConversation.delete(convId);
      // Delete messages associated (optional, or handle via cascade if supported, but here manually)
      const msgs = await base44.entities.YaraMessage.filter({ conversation_id: convId });
      for (const m of msgs) await base44.entities.YaraMessage.delete(m.id);

      const updatedConversations = conversations.filter(c => c.id !== convId);
      setConversations(updatedConversations);

      if (currentConversation?.id === convId) {
        if (updatedConversations.length > 0) {
          selectConversation(updatedConversations[0]);
        } else {
          createNewConversation();
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const content = inputMessage;
    setInputMessage("");
    setLoading(true);

    // Optimistic UI update
    const tempUserMsg = {
        role: "user",
        content: content,
        created_date: new Date().toISOString(),
        id: "temp_user_" + Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      let convId = currentConversation?.id;
      let isNew = false;

      // Create conversation if it doesn't exist yet
      if (!convId) {
        const title = content.length > 30 ? content.substring(0, 30) + "..." : content;
        const newConv = await base44.entities.YaraConversation.create({
            user_id: currentUser.id,
            title: title,
            last_message: content
        });
        convId = newConv.id;
        setCurrentConversation(newConv);
        setConversations(prev => [newConv, ...prev]);
        isNew = true;
      } else {
         // Update existing conversation last_message
         await base44.entities.YaraConversation.update(convId, { last_message: content });
         setConversations(prev => prev.map(c => c.id === convId ? { ...c, last_message: content } : c));
      }

      // Save User Message
      await base44.entities.YaraMessage.create({
        conversation_id: convId,
        role: "user",
        content: content
      });

      // Prepare context and call LLM
      const contextData = await getContextData(currentUser);
      const tonePrompts = {
        friendly: "با لحن بسیار دوستانه و صمیمی",
        professional: "با لحن حرفه‌ای و رسمی اما گرم",
        motivational: "با لحن انگیزشی و پرانرژی"
      };
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `
          تو یارا هستی، یک دستیار آموزشی هوشمند. به زبان فارسی پاسخ بده.
          
          تاریخچه مکالمه (در صورت نیاز استفاده کن):
          ${messages.slice(-5).map(m => `${m.role === 'user' ? 'کاربر' : 'یارا'}: ${m.content}`).join('\n')}
          
          **قوانین:**
          1. پاسخ مستقیم تکلیف نده، راهنمایی کن.
          2. از ایموجی استفاده کن.
          3. خلاق و دقیق باش.
          
          **تنظیمات:**
          - لحن: ${tonePrompts[yaraSettings.tone]}
          - جزئیات: ${yaraSettings.detail_level}
          - سبک: ${yaraSettings.language_style}
          
          **اطلاعات سیستم:**
          ${contextData}
          
          **پیام جدید کاربر:** "${content}"
          
          پاسخ:
        `
      });

      // Save Yara Message
      const aiMsg = await base44.entities.YaraMessage.create({
        conversation_id: convId,
        role: "assistant",
        content: response
      });

      setMessages(prev => [...prev, aiMsg]);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "متاسفم، مشکلی پیش آمده. لطفا دوباره تلاش کنید. 😔",
        id: "error_" + Date.now()
      }]);
    }

    setLoading(false);
  };

  const getContextData = async (user) => {
      // Simplified context gathering logic
      if (user.student_role === "student") {
          return `دانش‌آموز پایه ${user.grade || 'نامشخص'}.`;
      } else if (user.student_role === "teacher") {
          return `معلم درس ${user.subject || 'نامشخص'}.`;
      }
      return "";
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
        ...yaraSettings
      };
      
      if (existingSettings.length > 0) {
        await base44.entities.YaraSettings.update(existingSettings[0].id, settingsData);
      } else {
        await base44.entities.YaraSettings.create(settingsData);
      }
      setShowSettings(false);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-7xl mx-auto gap-4">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className={`${window.innerWidth < 768 ? 'fixed inset-0 z-40 bg-slate-900 p-4' : 'w-80'} flex flex-col`}
            >
                <div className="clay-card h-full flex flex-col p-4 bg-slate-800/50">
                    <div className="flex items-center justify-between mb-4">
                         <h2 className="text-white font-bold flex items-center gap-2">
                             <MessageSquare className="w-5 h-5 text-purple-400" />
                             مکالمات
                         </h2>
                         {window.innerWidth < 768 && (
                             <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(false)}>
                                 <X className="w-5 h-5 text-gray-400" />
                             </Button>
                         )}
                    </div>
                    
                    <Button 
                        onClick={() => createNewConversation()} 
                        className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        مکالمه جدید
                    </Button>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {conversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => selectConversation(conv)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${currentConversation?.id === conv.id ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className="font-medium text-white truncate pr-6">{conv.title}</div>
                                <div className="text-xs text-gray-400 truncate mt-1">{conv.last_message}</div>
                                
                                <button 
                                    onClick={(e) => deleteConversation(e, conv.id)}
                                    className="absolute left-2 top-3 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden clay-card relative">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-800/30">
            <div className="flex items-center gap-3">
                <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                    <Menu className="w-5 h-5 text-white" />
                </Button>
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                     <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white flex items-center gap-2">
                        یارا
                        <Sparkles className="w-4 h-4 text-purple-400" />
                    </h1>
                    <p className="text-xs text-gray-400">
                        {currentConversation?.id ? currentConversation.title : "مکالمه جدید"}
                    </p>
                </div>
            </div>
            <Button
                onClick={() => setShowSettings(true)}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
            >
                <Settings className="w-5 h-5" />
            </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
                    <Bot className="w-16 h-16 mb-4 text-purple-500/50" />
                    <p className="text-lg text-white mb-2">سلام! من یارا هستم.</p>
                    <p className="max-w-md">هر سوالی داری بپرس، من اینجام تا در یادگیری کمکت کنم.</p>
                </div>
            ) : (
                messages.map((msg, idx) => (
                    <motion.div
                        key={msg.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-purple-500/20' : 'bg-pink-500/20'}`}>
                            {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-purple-400" /> : <Bot className="w-4 h-4 text-pink-400" />}
                        </div>
                        <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-sm' : 'bg-slate-700/50 text-gray-100 rounded-tl-sm'}`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                            {msg.created_date && (
                                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                                    {toPersianTimeAgo(msg.created_date)}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))
            )}
            {loading && (
                <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                         <Bot className="w-4 h-4 text-pink-400" />
                     </div>
                     <div className="bg-slate-700/50 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-800/30 border-t border-white/10">
            <div className="flex gap-2">
                <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="پیام خود را بنویسید..."
                    className="bg-slate-900/50 border-slate-700 text-white focus:border-purple-500"
                    disabled={loading}
                />
                <Button 
                    onClick={sendMessage} 
                    disabled={!inputMessage.trim() || loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
        </div>
      </div>

      {/* Settings Modal (kept similar logic) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <motion.div 
                initial={{ scale: 0.95 }} 
                animate={{ scale: 1 }} 
                className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    تنظیمات یارا
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">سطح جزئیات</label>
                        <Select value={yaraSettings.detail_level} onValueChange={v => setYaraSettings({...yaraSettings, detail_level: v})}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brief">مختصر</SelectItem>
                                <SelectItem value="moderate">متوسط</SelectItem>
                                <SelectItem value="detailed">با جزئیات</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 block mb-1">لحن</label>
                        <Select value={yaraSettings.tone} onValueChange={v => setYaraSettings({...yaraSettings, tone: v})}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="friendly">دوستانه</SelectItem>
                                <SelectItem value="professional">رسمی</SelectItem>
                                <SelectItem value="motivational">انگیزشی</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={saveSettings} className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4">
                        ذخیره تنظیمات
                    </Button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}