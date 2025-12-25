import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, MessageCircle, BookOpen, UserPlus, Search } from "lucide-react";
import { motion } from "framer-motion";
import { toPersianDate, toPersianNumber } from "@/components/utils";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StudyGroups() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [classmates, setClassmates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Form
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupTopic, setGroupTopic] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [allConvs, allUsers] = await Promise.all([
        base44.entities.Conversation.list("-last_message_at"),
        base44.entities.PublicProfile.list()
      ]);

      // Filter groups I am part of
      const myGroups = allConvs.filter(c => 
        c.type === 'group' && 
        c.participants && 
        c.participants.includes(currentUser.id)
      );
      setGroups(myGroups);

      // Find classmates (same class_id)
      if (currentUser.class_id) {
        const myClassmates = allUsers.filter(u => 
          u.class_id === currentUser.class_id && 
          u.user_id !== currentUser.id &&
          u.student_role === 'student'
        );
        setClassmates(myClassmates);
      }
    } catch (error) {
      console.error("Error loading study groups:", error);
    }
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("نام گروه الزامی است");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("حداقل یک عضو انتخاب کنید");
      return;
    }

    try {
      // Create conversation with topic in name or description (if we had description)
      // For now, append topic to name if provided
      const finalName = groupTopic ? `${newGroupName} - ${groupTopic}` : newGroupName;
      
      const newConv = await base44.entities.Conversation.create({
        name: finalName,
        type: 'group',
        participants: [user.id, ...selectedMembers],
        created_by: user.id,
        class_id: user.class_id // Link to class context
      });

      toast.success("گروه مطالعه ایجاد شد");
      setShowCreateModal(false);
      setNewGroupName("");
      setGroupTopic("");
      setSelectedMembers([]);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("خطا در ایجاد گروه");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-cyan-400" />
            گروه‌های مطالعه
          </h1>
          <p className="text-gray-400">با همکلاسی‌های خود درس بخوانید و رفع اشکال کنید</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="w-4 h-4 mr-2" /> گروه جدید
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, idx) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="clay-card hover:scale-[1.02] transition-transform">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl mb-2">
                    {group.name.charAt(0)}
                  </div>
                  <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
                    {group.participants.length} عضو
                  </Badge>
                </div>
                <CardTitle className="text-white truncate" title={group.name}>
                  {group.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">
                  {group.last_message || "هنوز پیامی ارسال نشده است..."}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {group.last_message_at ? toPersianDate(group.last_message_at) : "جدید"}
                  </span>
                  <Link to={createPageUrl("Messages")}>
                    <Button size="sm" className="bg-slate-700 hover:bg-cyan-600 text-white">
                      <MessageCircle className="w-4 h-4 mr-2" /> ورود به گفتگو
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        
        {groups.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Users className="w-20 h-20 mx-auto mb-4 opacity-20" />
            <p className="text-lg">شما عضو هیچ گروه مطالعه‌ای نیستید.</p>
            <Button variant="link" onClick={() => setShowCreateModal(true)} className="text-cyan-400">
              اولین گروه را بسازید
            </Button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="clay-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">ایجاد گروه مطالعه جدید</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">نام گروه</label>
                <Input 
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="مثال: ریاضی فصل اول"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">موضوع (اختیاری)</label>
                <Input 
                  value={groupTopic}
                  onChange={e => setGroupTopic(e.target.value)}
                  placeholder="مثال: حل تمرین"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">دعوت از همکلاسی‌ها</label>
                <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-700 rounded-lg p-2 space-y-2">
                  {classmates.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center">همکلاسی یافت نشد</p>
                  ) : (
                    classmates.map(mate => (
                      <label key={mate.user_id} className="flex items-center gap-2 p-2 hover:bg-slate-700/50 rounded cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={selectedMembers.includes(mate.user_id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedMembers([...selectedMembers, mate.user_id]);
                            else setSelectedMembers(selectedMembers.filter(id => id !== mate.user_id));
                          }}
                          className="rounded border-slate-600 bg-slate-700"
                        />
                        <span className="text-sm text-white">{mate.full_name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-right text-gray-500 mt-1">
                  {toPersianNumber(selectedMembers.length)} نفر انتخاب شده‌اند
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  انصراف
                </Button>
                <Button onClick={handleCreateGroup} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                  ایجاد گروه
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}