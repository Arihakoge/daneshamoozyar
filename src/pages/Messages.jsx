import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Users, Search, Plus, Send, Paperclip, X, Clock } from "lucide-react";
import { toPersianDate, toPersianTimeAgo, toPersianNumber } from "@/components/utils";
import { toast } from "sonner";

export default function Messages() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [chatType, setChatType] = useState("private");
  const [groupName, setGroupName] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => {
        loadMessages(selectedConversation.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Reload conversations periodically to get new messages
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allConvs, publicProfiles, allClasses, allMessages] = await Promise.all([
        base44.entities.Conversation.list("-last_message_at"),
        base44.entities.PublicProfile.list(),
        base44.entities.Class.list(),
        base44.entities.Message.list()
      ]);

      // Normalize profiles to be used like users
      const users = publicProfiles.map(p => ({
        ...p,
        id: p.user_id // Use user_id as id for compatibility
      }));

      const userConversations = allConvs.filter(c => 
        c.participants && c.participants.includes(currentUser.id)
      );
      
      setConversations(userConversations);
      setAllUsers(users);
      setClasses(allClasses);
      setMessages(allMessages);
    } catch (error) {
      console.error("خطا در بارگیری:", error);
    }
    setLoading(false);
  };

  const loadMessages = async (conversationId) => {
    try {
      const msgs = await base44.entities.Message.filter(
        { conversation_id: conversationId },
        "created_date"
      );
      setMessages(msgs);
      
      // Mark messages as read
      const unreadMessages = msgs.filter(m => 
        m.sender_id !== user.id && (!m.read_by || !m.read_by.includes(user.id))
      );
      
      for (const msg of unreadMessages) {
        const readBy = msg.read_by || [];
        if (!readBy.includes(user.id)) {
          await base44.entities.Message.update(msg.id, {
            read_by: [...readBy, user.id]
          });
        }
      }
    } catch (error) {
      console.error("خطا در بارگیری پیام‌ها:", error);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !file) || !selectedConversation) return;

    setSending(true);
    try {
      let fileUrl = "";
      let fileName = "";
      
      if (file) {
        setUploading(true);
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        fileUrl = uploadResult.file_url;
        fileName = file.name;
        setUploading(false);
      }

      const messageData = {
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
        file_url: fileUrl,
        file_name: fileName,
        read_by: [user.id]
      };

      await base44.entities.Message.create(messageData);
      
      await base44.entities.Conversation.update(selectedConversation.id, {
        last_message: newMessage.trim() || `📎 ${fileName}`,
        last_message_at: new Date().toISOString()
      });

      setNewMessage("");
      setFile(null);
      loadMessages(selectedConversation.id);
      loadData();
    } catch (error) {
      console.error("خطا در ارسال پیام:", error);
      toast.error("خطا در ارسال پیام");
    }
    setSending(false);
  };

  const handleCreateConversation = async () => {
    if (chatType === "private" && selectedUsers.length !== 1) {
      toast.error("یک نفر را انتخاب کنید");
      return;
    }
    
    if (chatType === "group" && (selectedUsers.length < 2 || !groupName.trim())) {
      toast.error("حداقل دو نفر و یک نام برای گروه انتخاب کنید");
      return;
    }

    if (chatType === "class" && !selectedClass) {
      toast.error("یک کلاس انتخاب کنید");
      return;
    }

    try {
      let participants = [user.id, ...selectedUsers];
      let name = "";
      let classId = "";

      if (chatType === "private") {
        const otherUser = allUsers.find(u => u.id === selectedUsers[0]);
        name = otherUser?.full_name || "کاربر";
      } else if (chatType === "group") {
        name = groupName;
      } else if (chatType === "class") {
        const classData = classes.find(c => c.id === selectedClass);
        name = classData?.name || "کلاس";
        classId = selectedClass;
        
        // Add all students of this class
        const classStudents = allUsers.filter(u => 
          u.student_role === "student" && u.class_id === selectedClass
        );
        participants = [user.id, ...classStudents.map(s => s.id)];
      }

      const newConv = await base44.entities.Conversation.create({
        name,
        type: chatType,
        participants,
        class_id: classId,
        created_by: user.id
      });

      setShowNewChat(false);
      setSelectedUsers([]);
      setGroupName("");
      setSelectedClass("");
      loadData();
      setSelectedConversation(newConv);
      toast.success("گفتگو ایجاد شد");
    } catch (error) {
      console.error("خطا در ایجاد گفتگو:", error);
      toast.error("خطا در ایجاد گفتگو");
    }
  };

  const getConversationName = (conv) => {
    if (conv.name) return conv.name;
    
    const otherParticipant = conv.participants.find(p => p !== user.id);
    const otherUser = allUsers.find(u => u.id === otherParticipant);
    return otherUser?.full_name || "کاربر حذف شده";
  };

  const hasUnreadMessages = (conv) => {
    const convMessages = messages.filter(m => m.conversation_id === conv.id);
    return convMessages.some(m => 
      m.sender_id !== user.id && 
      (!m.read_by || !m.read_by.includes(user.id))
    );
  };

  const getUnreadCount = (convId) => {
    return messages.filter(m => 
      m.conversation_id === convId && 
      m.sender_id !== user.id && 
      (!m.read_by || !m.read_by.includes(user.id))
    ).length;
  };

  const filteredConversations = conversations.filter(c => 
    getConversationName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white">در حال بارگیری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-purple-400" />
          پیام‌ها
        </h1>
        <p className="text-gray-300">ارتباط با همکلاسی‌ها و معلمان</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-100px)]">
        {/* Conversations List */}
        <div className="clay-card p-4 flex flex-col h-full">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="جستجو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="clay-card text-white pr-10"
              />
            </div>
            {user?.student_role && (user.student_role === 'teacher' || user.student_role === 'admin') && (
              <Button onClick={() => setShowNewChat(true)} className="clay-button bg-purple-600">
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
            {filteredConversations.map((conv) => {
              const unreadCount = messages.filter(m => 
                m.conversation_id === conv.id && 
                m.sender_id !== user.id && 
                (!m.read_by || !m.read_by.includes(user.id))
              ).length;

              return (
                <motion.button
                  key={conv.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full clay-card p-3 text-right transition-all ${
                    selectedConversation?.id === conv.id ? 'bg-purple-500/20 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                      {conv.type === 'private' ? (
                        <span className="text-white font-bold text-lg">
                          {getConversationName(conv).charAt(0)}
                        </span>
                      ) : (
                        <Users className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white truncate">{getConversationName(conv)}</h3>
                        {conv.last_message_at && (
                          <span className="text-xs text-gray-400">
                            {toPersianTimeAgo(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{conv.last_message || "پیامی وجود ندارد"}</p>
                    </div>
                    {unreadCount > 0 && (
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-bold">{toPersianNumber(unreadCount)}</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2 clay-card flex flex-col h-full">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="clay-card p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    {selectedConversation.type === 'private' ? (
                      <span className="text-white font-bold">
                        {getConversationName(selectedConversation).charAt(0)}
                      </span>
                    ) : (
                      <Users className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{getConversationName(selectedConversation)}</h3>
                    <p className="text-xs text-gray-400">
                      {selectedConversation.type === 'private' ? 'گفتگوی خصوصی' : 
                       selectedConversation.type === 'class' ? 'گروه کلاسی' : 'گروه'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg) => {
                  const sender = allUsers.find(u => u.id === msg.sender_id);
                  const isMe = msg.sender_id === user.id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                        {!isMe && selectedConversation.type !== 'private' && (
                          <p className="text-xs text-gray-400 mb-1 mr-2">{sender?.full_name || "کاربر حذف شده"}</p>
                        )}
                        <div className={`clay-card p-3 ${isMe ? 'bg-purple-600' : 'bg-slate-700'}`}>
                          {msg.content && <p className="text-white">{msg.content}</p>}
                          {msg.file_url && (
                            <a
                              href={msg.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 mt-2 text-blue-300 hover:text-blue-200"
                            >
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm">{msg.file_name || 'فایل ضمیمه'}</span>
                            </a>
                          )}
                          <p className="text-xs text-gray-300 mt-2">
                            {toPersianTimeAgo(msg.created_date)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="clay-card p-4 border-t border-gray-700">
                {file && (
                  <div className="flex items-center gap-2 mb-2 p-2 bg-slate-700 rounded-lg">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white flex-1">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-red-400 hover:text-red-300">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="ghost" className="clay-button" asChild>
                      <span>
                        <Paperclip className="w-5 h-5" />
                      </span>
                    </Button>
                  </label>
                  <Input
                    placeholder="پیام خود را بنویسید..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="clay-card text-white flex-1"
                    disabled={sending || uploading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || uploading || (!newMessage.trim() && !file)}
                    className="clay-button bg-purple-600"
                  >
                    {sending || uploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg">یک گفتگو را انتخاب کنید</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewChat(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="clay-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">گفتگوی جدید</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">نوع گفتگو</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setChatType("private")}
                      className={`clay-button p-3 ${chatType === "private" ? "bg-purple-600" : ""}`}
                    >
                      خصوصی
                    </button>
                    <button
                      onClick={() => setChatType("group")}
                      className={`clay-button p-3 ${chatType === "group" ? "bg-purple-600" : ""}`}
                    >
                      گروه
                    </button>
                    <button
                      onClick={() => setChatType("class")}
                      className={`clay-button p-3 ${chatType === "class" ? "bg-purple-600" : ""}`}
                    >
                      کلاسی
                    </button>
                  </div>
                </div>

                {chatType === "class" ? (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">انتخاب کلاس</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full clay-card text-white p-2 rounded"
                    >
                      <option value="">انتخاب کنید</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    {chatType === "group" && (
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">نام گروه</label>
                        <Input
                          placeholder="نام گروه را وارد کنید"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          className="clay-card text-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        انتخاب {chatType === "private" ? "کاربر" : "اعضا"}
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {allUsers.filter(u => u.id !== user.id).map(u => (
                          <label
                            key={u.id}
                            className="flex items-center gap-3 p-2 clay-card cursor-pointer hover:bg-purple-500/10"
                          >
                            <input
                              type={chatType === "private" ? "radio" : "checkbox"}
                              checked={selectedUsers.includes(u.id)}
                              onChange={(e) => {
                                if (chatType === "private") {
                                  setSelectedUsers(e.target.checked ? [u.id] : []);
                                } else {
                                  setSelectedUsers(
                                    e.target.checked
                                      ? [...selectedUsers, u.id]
                                      : selectedUsers.filter(id => id !== u.id)
                                  );
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                              {u.full_name?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{u.full_name}</p>
                              <p className="text-xs text-gray-400">
                                {u.student_role === "teacher" ? "معلم" : u.student_role === "admin" ? "مدیر" : "دانش‌آموز"}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowNewChat(false)}
                    variant="outline"
                    className="flex-1 clay-button"
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={handleCreateConversation}
                    className="flex-1 clay-button bg-purple-600"
                  >
                    ایجاد
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}