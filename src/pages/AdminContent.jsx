import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Eye, 
  Megaphone, 
  BarChart2, 
  Edit,
  Search,
  Upload
} from "lucide-react";
import { toPersianDate, toPersianNumber } from "@/components/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState("resources");
  const [resources, setResources] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "", description: "", type: "link", url: "", grade: "", subject: ""
  });
  const [isUploading, setIsUploading] = useState(false);

  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "", content: "", target_role: "all", priority: "medium"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, annData] = await Promise.all([
        base44.entities.LearningResource.list("-created_date"),
        base44.entities.Announcement.list("-created_date")
      ]);
      setResources(resData);
      setAnnouncements(annData);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("خطا در بارگیری اطلاعات");
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setResourceForm(prev => ({ ...prev, url: file_url }));
      toast.success("فایل با موفقیت آپلود شد");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در آپلود فایل");
    }
    setIsUploading(false);
  };

  const handleSaveResource = async () => {
    if (!resourceForm.title || !resourceForm.url) {
      toast.error("لطفا عنوان و آدرس/فایل را مشخص کنید");
      return;
    }

    try {
      await base44.entities.LearningResource.create(resourceForm);
      toast.success("منبع آموزشی ایجاد شد");
      setIsResourceModalOpen(false);
      setResourceForm({ title: "", description: "", type: "link", url: "", grade: "", subject: "" });
      loadData();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("خطا در ذخیره منبع");
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm("آیا از حذف این منبع مطمئن هستید؟")) return;
    try {
      await base44.entities.LearningResource.delete(id);
      loadData();
      toast.success("منبع حذف شد");
    } catch (error) {
      toast.error("خطا در حذف");
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content) {
      toast.error("لطفا عنوان و متن را وارد کنید");
      return;
    }

    try {
      await base44.entities.Announcement.create(announcementForm);
      toast.success("اطلاعیه ایجاد شد");
      setIsAnnouncementModalOpen(false);
      setAnnouncementForm({ title: "", content: "", target_role: "all", priority: "medium" });
      loadData();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast.error("خطا در ذخیره اطلاعیه");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("آیا از حذف این اطلاعیه مطمئن هستید؟")) return;
    try {
      await base44.entities.Announcement.delete(id);
      loadData();
      toast.success("اطلاعیه حذف شد");
    } catch (error) {
      toast.error("خطا در حذف");
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'video': return <Video className="w-4 h-4 text-blue-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
      default: return <LinkIcon className="w-4 h-4 text-green-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-500" />
            مدیریت محتوای آموزشی
          </h1>
          <p className="text-slate-400 text-lg">مدیریت منابع، اطلاعیه‌ها و گزارشات</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="clay-card border-none bg-black/20">
            <TabsTrigger value="resources" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300">
              <FileText className="w-4 h-4 ml-2" /> منابع آموزشی
            </TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-purple-600">
              <Megaphone className="w-4 h-4 ml-2" /> اطلاعیه‌ها
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              <BarChart2 className="w-4 h-4 ml-2" /> آمار و گزارشات
            </TabsTrigger>
          </TabsList>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-64">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input placeholder="جستجو در منابع..." className="pr-10 bg-slate-900 border-slate-800" />
              </div>
              <Dialog open={isResourceModalOpen} onOpenChange={setIsResourceModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 ml-2" /> افزودن منبع جدید
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader>
                    <DialogTitle>افزودن منبع آموزشی</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">عنوان</label>
                      <Input 
                        value={resourceForm.title} 
                        onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})}
                        className="bg-slate-800 border-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">توضیحات</label>
                      <Textarea 
                        value={resourceForm.description} 
                        onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                        className="bg-slate-800 border-slate-700" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">نوع</label>
                        <Select 
                          value={resourceForm.type} 
                          onValueChange={(val) => setResourceForm({...resourceForm, type: val})}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="link">لینک اینترنتی</SelectItem>
                            <SelectItem value="pdf">فایل PDF</SelectItem>
                            <SelectItem value="video">ویدیو</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">پایه (اختیاری)</label>
                        <Select 
                          value={resourceForm.grade} 
                          onValueChange={(val) => setResourceForm({...resourceForm, grade: val})}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue placeholder="همه پایه‌ها" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="هفتم">هفتم</SelectItem>
                            <SelectItem value="هشتم">هشتم</SelectItem>
                            <SelectItem value="نهم">نهم</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {resourceForm.type === 'link' ? (
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">آدرس لینک</label>
                        <Input 
                          value={resourceForm.url} 
                          onChange={(e) => setResourceForm({...resourceForm, url: e.target.value})}
                          placeholder="https://..."
                          className="bg-slate-800 border-slate-700" 
                          dir="ltr"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">آپلود فایل</label>
                        <div className="flex gap-2">
                          <Input 
                            type="file" 
                            onChange={handleFileUpload}
                            className="bg-slate-800 border-slate-700" 
                          />
                          {isUploading && <div className="animate-spin h-5 w-5 border-2 border-purple-500 rounded-full border-t-transparent mt-2"></div>}
                        </div>
                        {resourceForm.url && <p className="text-xs text-green-400 mt-1">فایل آپلود شد</p>}
                      </div>
                    )}
                    
                    <Button onClick={handleSaveResource} className="w-full bg-purple-600 hover:bg-purple-700">
                      ذخیره منبع
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <Card key={resource.id} className="clay-card hover:scale-[1.02] transition-transform">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-black/20 rounded-lg">
                        {getTypeIcon(resource.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">{resource.title}</CardTitle>
                        <p className="text-xs text-slate-400 mt-1">
                          {resource.subject ? resource.subject : 'عمومی'} • {resource.grade ? resource.grade : 'همه پایه‌ها'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2 h-10">
                      {resource.description || "بدون توضیحات"}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {toPersianNumber(resource.view_count)}</span>
                        <span>{toPersianDate(resource.created_date)}</span>
                      </div>
                      <div className="flex gap-2">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-400 hover:text-blue-300">
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </a>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDeleteResource(resource.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {resources.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  هیچ منبع آموزشی یافت نشد.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements">
            <div className="flex justify-end mb-6">
              <Dialog open={isAnnouncementModalOpen} onOpenChange={setIsAnnouncementModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 ml-2" /> اطلاعیه جدید
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                  <DialogHeader>
                    <DialogTitle>ایجاد اطلاعیه جدید</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">عنوان</label>
                      <Input 
                        value={announcementForm.title} 
                        onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                        className="bg-slate-800 border-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 mb-1 block">متن اطلاعیه</label>
                      <Textarea 
                        value={announcementForm.content} 
                        onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                        className="bg-slate-800 border-slate-700 h-32" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">مخاطبین</label>
                        <Select 
                          value={announcementForm.target_role} 
                          onValueChange={(val) => setAnnouncementForm({...announcementForm, target_role: val})}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="all">همه کاربران</SelectItem>
                            <SelectItem value="student">دانش‌آموزان</SelectItem>
                            <SelectItem value="teacher">معلمان</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-1 block">اولویت</label>
                        <Select 
                          value={announcementForm.priority} 
                          onValueChange={(val) => setAnnouncementForm({...announcementForm, priority: val})}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="low">عادی</SelectItem>
                            <SelectItem value="medium">مهم</SelectItem>
                            <SelectItem value="high">فوری</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleSaveAnnouncement} className="w-full bg-purple-600 hover:bg-purple-700">
                      انتشار اطلاعیه
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {announcements.map((ann) => (
                <Card key={ann.id} className="clay-card">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{ann.title}</h3>
                          <Badge className={
                            ann.priority === 'high' ? 'bg-red-500/20 text-red-300' : 
                            ann.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 
                            'bg-blue-500/20 text-blue-300'
                          }>
                            {ann.priority === 'high' ? 'فوری' : ann.priority === 'medium' ? 'مهم' : 'عادی'}
                          </Badge>
                          <Badge variant="outline" className="border-slate-700 text-slate-400">
                            {ann.target_role === 'all' ? 'همه' : ann.target_role === 'student' ? 'دانش‌آموزان' : 'معلمان'}
                          </Badge>
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap">{ann.content}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="text-xs text-slate-500 mt-4 text-left">
                      منتشر شده در: {toPersianDate(ann.created_date)}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  هیچ اطلاعیه‌ای ثبت نشده است.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="clay-card">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">کل منابع</p>
                    <p className="text-3xl font-bold text-white">{toPersianNumber(resources.length)}</p>
                  </div>
                  <FileText className="w-10 h-10 text-blue-500 opacity-50" />
                </CardContent>
              </Card>
              <Card className="clay-card">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">بازدید کل</p>
                    <p className="text-3xl font-bold text-green-400">
                      {toPersianNumber(resources.reduce((acc, curr) => acc + (curr.view_count || 0), 0))}
                    </p>
                  </div>
                  <Eye className="w-10 h-10 text-green-500 opacity-50" />
                </CardContent>
              </Card>
              <Card className="clay-card">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">اطلاعیه‌های فعال</p>
                    <p className="text-3xl font-bold text-purple-400">{toPersianNumber(announcements.filter(a => a.is_active).length)}</p>
                  </div>
                  <Megaphone className="w-10 h-10 text-purple-500 opacity-50" />
                </CardContent>
              </Card>
            </div>

            <Card className="clay-card">
              <CardHeader>
                <CardTitle className="text-white">پر بازدیدترین منابع</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-slate-400">عنوان</TableHead>
                      <TableHead className="text-slate-400">نوع</TableHead>
                      <TableHead className="text-slate-400">بازدید</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...resources].sort((a,b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 5).map(res => (
                      <TableRow key={res.id} className="border-white/10 hover:bg-black/20">
                        <TableCell className="text-white font-medium">{res.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-700 text-slate-300">
                            {res.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-400 font-bold">{toPersianNumber(res.view_count || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}