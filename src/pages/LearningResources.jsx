import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Video, 
  Link as LinkIcon, 
  Upload, 
  Trash2, 
  ExternalLink, 
  Search,
  Filter,
  Plus,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPersianDate } from "@/components/utils";

export default function LearningResources() {
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // New Resource Form
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    type: "pdf", // pdf, video, link
    url: "",
    category: "",
    grade: "",
    subject: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      let allResources = [];
      if (currentUser.student_role === "teacher" || currentUser.student_role === "admin") {
        allResources = await base44.entities.LearningResource.list("-created_date");
      } else {
        // Students see resources for their grade or public ones
        allResources = await base44.entities.LearningResource.filter({ is_active: true }, "-created_date");
        if (currentUser.grade) {
            allResources = allResources.filter(r => !r.grade || r.grade === currentUser.grade);
        }
      }
      setResources(allResources);
    } catch (error) {
      console.error("Error loading resources:", error);
    }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (newResource.type !== 'link' && !selectedFile) {
        alert("لطفاً یک فایل انتخاب کنید");
        return null;
    }

    if (newResource.type === 'link') return newResource.url;

    try {
        const res = await base44.integrations.Core.UploadFile({ file: selectedFile });
        return res.file_url;
    } catch (error) {
        console.error("Upload failed", error);
        alert("خطا در آپلود فایل");
        return null;
    }
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
        const url = await handleFileUpload();
        if (!url) {
            setIsUploading(false);
            return;
        }

        await base44.entities.LearningResource.create({
            ...newResource,
            url: url,
            teacher_id: user.id,
            is_active: true
        });

        setIsModalOpen(false);
        setNewResource({
            title: "",
            description: "",
            type: "pdf",
            url: "",
            category: "",
            grade: user.student_role === 'teacher' ? (user.grade || "") : "",
            subject: user.student_role === 'teacher' ? (user.subject || "") : ""
        });
        setSelectedFile(null);
        loadData();
    } catch (error) {
        console.error("Error creating resource:", error);
    }
    setIsUploading(false);
  };

  const handleDelete = async (id) => {
    if (confirm("آیا از حذف این منبع اطمینان دارید؟")) {
        await base44.entities.LearningResource.delete(id);
        loadData();
    }
  };

  const getIcon = (type) => {
    switch (type) {
        case 'video': return <Video className="w-5 h-5 text-red-400" />;
        case 'link': return <LinkIcon className="w-5 h-5 text-blue-400" />;
        default: return <FileText className="w-5 h-5 text-orange-400" />;
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.includes(searchQuery) || (r.description && r.description.includes(searchQuery));
    const matchesSubject = filterSubject === "all" || r.subject === filterSubject;
    const matchesType = filterType === "all" || r.type === filterType;
    return matchesSearch && matchesSubject && matchesType;
  });

  if (loading) return <div className="text-center text-white mt-20">در حال بارگذاری...</div>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Book className="w-8 h-8 text-cyan-500" />
            منابع آموزشی
          </h1>
          <p className="text-gray-400">دسترسی به جزوات، ویدئوها و منابع کمک آموزشی</p>
        </div>
        {(user?.student_role === 'teacher' || user?.student_role === 'admin') && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> افزودن منبع جدید
            </Button>
        )}
      </motion.div>

      <div className="clay-card p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
            <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            <Input 
                placeholder="جستجو..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10 bg-slate-800 border-slate-700 text-white"
            />
        </div>
        <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="p-2 rounded-md bg-slate-800 border-slate-700 text-white"
        >
            <option value="all">همه انواع</option>
            <option value="pdf">PDF / جزوه</option>
            <option value="video">ویدئو</option>
            <option value="link">لینک</option>
        </select>
        <select 
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="p-2 rounded-md bg-slate-800 border-slate-700 text-white"
        >
            <option value="all">همه دروس</option>
            {/* Populate dynamically if possible, hardcoded for now based on common subjects */}
            {["ریاضی", "علوم", "فارسی", "انگلیسی", "عربی", "مطالعات"].map(s => (
                <option key={s} value={s}>{s}</option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource, index) => (
            <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
            >
                <Card className="clay-card h-full flex flex-col hover:shadow-lg transition-all border-r-4 border-cyan-500">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                {getIcon(resource.type)}
                                {resource.title}
                            </CardTitle>
                            {resource.type === 'pdf' && <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">PDF</Badge>}
                            {resource.type === 'video' && <Badge variant="secondary" className="bg-red-500/20 text-red-300">Video</Badge>}
                            {resource.type === 'link' && <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">Link</Badge>}
                        </div>
                        <div className="flex gap-2 mt-2">
                            {resource.subject && <Badge variant="outline" className="text-gray-400 border-gray-600">{resource.subject}</Badge>}
                            {resource.grade && <Badge variant="outline" className="text-gray-400 border-gray-600">{resource.grade}</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pt-2">
                        <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-3">{resource.description}</p>
                        <div className="flex gap-2 mt-auto">
                            <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                                <Button variant="outline" className="w-full border-cyan-600 text-cyan-400 hover:bg-cyan-600 hover:text-white">
                                    <ExternalLink className="w-4 h-4 mr-2" /> مشاهده / دانلود
                                </Button>
                            </a>
                            {(user?.id === resource.teacher_id || user?.student_role === 'admin') && (
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(resource.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="clay-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-bold text-white mb-4">افزودن منبع جدید</h2>
                    <form onSubmit={handleCreateResource} className="space-y-4">
                        <Input 
                            placeholder="عنوان" 
                            value={newResource.title} 
                            onChange={e => setNewResource({...newResource, title: e.target.value})} 
                            required 
                            className="bg-slate-800 text-white"
                        />
                        <Textarea 
                            placeholder="توضیحات" 
                            value={newResource.description} 
                            onChange={e => setNewResource({...newResource, description: e.target.value})} 
                            className="bg-slate-800 text-white"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <select 
                                value={newResource.type} 
                                onChange={e => setNewResource({...newResource, type: e.target.value})}
                                className="p-2 rounded bg-slate-800 text-white border border-slate-700"
                            >
                                <option value="pdf">فایل PDF / جزوه</option>
                                <option value="video">ویدئو</option>
                                <option value="link">لینک خارجی</option>
                            </select>
                            <select 
                                value={newResource.grade} 
                                onChange={e => setNewResource({...newResource, grade: e.target.value})}
                                className="p-2 rounded bg-slate-800 text-white border border-slate-700"
                            >
                                <option value="">همه پایه‌ها</option>
                                <option value="هفتم">هفتم</option>
                                <option value="هشتم">هشتم</option>
                                <option value="نهم">نهم</option>
                            </select>
                        </div>
                        <Input 
                            placeholder="درس مرتبط (اختیاری)" 
                            value={newResource.subject} 
                            onChange={e => setNewResource({...newResource, subject: e.target.value})} 
                            className="bg-slate-800 text-white"
                        />
                        
                        {newResource.type === 'link' ? (
                            <Input 
                                placeholder="https://..." 
                                value={newResource.url} 
                                onChange={e => setNewResource({...newResource, url: e.target.value})} 
                                required 
                                className="bg-slate-800 text-white ltr"
                            />
                        ) : (
                            <div className="border border-dashed border-gray-600 rounded-lg p-4 text-center">
                                <Input 
                                    type="file" 
                                    onChange={e => setSelectedFile(e.target.files[0])} 
                                    className="hidden" 
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer text-cyan-400 flex flex-col items-center">
                                    <Upload className="w-8 h-8 mb-2" />
                                    {selectedFile ? selectedFile.name : "انتخاب فایل"}
                                </label>
                            </div>
                        )}

                        <div className="flex gap-2 mt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 text-gray-400">انصراف</Button>
                            <Button type="submit" disabled={isUploading} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
                                {isUploading ? "در حال آپلود..." : "افزودن"}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}