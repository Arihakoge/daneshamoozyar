import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Plus, 
  Save, 
  Trash2, 
  Link as LinkIcon, 
  Search, 
  FileText, 
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianDate, toPersianNumber } from "@/components/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StudentNotebook() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Linking data
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    assignment_id: "none",
    resource_id: "none",
    tags: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const [userNotes, userAssignments, gradeResources] = await Promise.all([
        base44.entities.Note.filter({ user_id: user.id }, "-updated_date"),
        base44.entities.Assignment.list(), // Optimized: filter by class/grade in real app
        base44.entities.LearningResource.filter({ grade: user.grade || "هفتم" })
      ]);
      
      setNotes(userNotes);
      setAssignments(userAssignments);
      setResources(gradeResources);
    } catch (error) {
      console.error("Error loading notebook:", error);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setSelectedNote(null);
    setFormData({
      title: "",
      content: "",
      assignment_id: "none",
      resource_id: "none",
      tags: ""
    });
    setIsEditing(true);
  };

  const handleEdit = (note) => {
    setSelectedNote(note);
    setFormData({
      title: note.title,
      content: note.content || "",
      assignment_id: note.assignment_id || "none",
      resource_id: note.resource_id || "none",
      tags: note.tags ? note.tags.join(", ") : ""
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error("عنوان یادداشت الزامی است");
      return;
    }

    try {
      const user = await base44.auth.me();
      const noteData = {
        user_id: user.id,
        title: formData.title,
        content: formData.content,
        assignment_id: formData.assignment_id === "none" ? null : formData.assignment_id,
        resource_id: formData.resource_id === "none" ? null : formData.resource_id,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean)
      };

      if (selectedNote) {
        await base44.entities.Note.update(selectedNote.id, noteData);
        toast.success("یادداشت بروزرسانی شد");
      } else {
        await base44.entities.Note.create(noteData);
        toast.success("یادداشت جدید ایجاد شد");
      }

      setIsEditing(false);
      loadData();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("خطا در ذخیره یادداشت");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("آیا از حذف این یادداشت مطمئن هستید؟")) return;
    try {
      await base44.entities.Note.delete(id);
      toast.success("یادداشت حذف شد");
      setNotes(prev => prev.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("خطا در حذف یادداشت");
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Book className="w-8 h-8 text-yellow-400" />
            دفترچه یادداشت دیجیتال
          </h1>
          <p className="text-gray-400">یادداشت‌برداری، برنامه‌ریزی و مدیریت منابع</p>
        </div>
        <Button onClick={handleCreate} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
          <Plus className="w-4 h-4 mr-2" /> یادداشت جدید
        </Button>
      </div>

      <div className="flex gap-6 h-full overflow-hidden">
        {/* Sidebar List */}
        <div className="w-1/3 clay-card p-4 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="جستجو در یادداشت‌ها..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9 bg-slate-800/50 border-slate-700 text-white"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
            {loading ? (
              <p className="text-center text-gray-400 mt-4">در حال بارگیری...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-center text-gray-500 mt-4">یادداشتی یافت نشد</p>
            ) : (
              filteredNotes.map(note => (
                <div 
                  key={note.id}
                  onClick={() => handleEdit(note)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedNote?.id === note.id 
                      ? "bg-yellow-500/20 border-yellow-500" 
                      : "bg-slate-800/30 border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <h3 className="font-bold text-white mb-1 truncate">{note.title}</h3>
                  <p className="text-xs text-gray-400 mb-2 truncate">{note.content}</p>
                  <div className="flex flex-wrap gap-1">
                    {note.tags && note.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2 text-left">
                    {toPersianDate(note.updated_date || note.created_date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Area */}
        <div className="w-2/3 clay-card p-6 flex flex-col">
          {isEditing ? (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex justify-between items-center">
                <Input 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="عنوان یادداشت..."
                  className="text-xl font-bold bg-transparent border-none text-white focus-visible:ring-0 px-0 placeholder-gray-500"
                />
                <div className="flex gap-2">
                  {selectedNote && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedNote.id)} className="text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" /> ذخیره
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">تکلیف مرتبط</label>
                    <Select 
                        value={formData.assignment_id} 
                        onValueChange={v => setFormData({...formData, assignment_id: v})}
                    >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-xs">
                            <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="none">هیچکدام</SelectItem>
                            {assignments.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">منبع مرتبط</label>
                    <Select 
                        value={formData.resource_id} 
                        onValueChange={v => setFormData({...formData, resource_id: v})}
                    >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-xs">
                            <SelectValue placeholder="انتخاب کنید" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="none">هیچکدام</SelectItem>
                            {resources.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <Textarea 
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="یادداشت خود را بنویسید..."
                className="flex-1 bg-slate-900/30 border-slate-700 text-white resize-none p-4 leading-relaxed"
              />

              <div>
                <label className="text-xs text-gray-400 mb-1 block">برچسب‌ها (با کاما جدا کنید)</label>
                <Input 
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  placeholder="مثال: ریاضی, امتحان, مهم"
                  className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Book className="w-16 h-16 mb-4 opacity-20" />
              <p>یک یادداشت را انتخاب کنید یا جدید بسازید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}