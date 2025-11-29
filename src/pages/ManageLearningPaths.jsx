import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash2, Rocket, BookOpen, FileQuestion, 
  Target, Flame, Save, X, ChevronDown, ChevronUp, GripVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toPersianNumber } from "@/components/utils";

const stageTypeConfig = {
  lesson: { icon: BookOpen, label: "درس", color: "bg-blue-500" },
  quiz: { icon: FileQuestion, label: "آزمون", color: "bg-purple-500" },
  assignment: { icon: Target, label: "تکلیف", color: "bg-green-500" },
  challenge: { icon: Flame, label: "چالش", color: "bg-orange-500" }
};

export default function ManageLearningPaths() {
  const [user, setUser] = useState(null);
  const [paths, setPaths] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPathModal, setShowPathModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingPath, setEditingPath] = useState(null);
  const [editingStage, setEditingStage] = useState(null);
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [expandedPath, setExpandedPath] = useState(null);

  const [pathForm, setPathForm] = useState({
    title: "", description: "", subject: "ریاضی", grade: "هفتم",
    difficulty: "beginner", coins_reward: 100, color: "#8B5CF6"
  });

  const [stageForm, setStageForm] = useState({
    title: "", description: "", stage_type: "lesson", content: "",
    xp_reward: 50, coins_reward: 10, passing_score: 60, time_limit: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [teacherPaths, allStages] = await Promise.all([
        base44.entities.LearningPath.filter({ teacher_id: currentUser.id }),
        base44.entities.PathStage.list()
      ]);

      setPaths(teacherPaths || []);
      setStages(allStages || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const savePath = async () => {
    try {
      if (editingPath) {
        await base44.entities.LearningPath.update(editingPath.id, pathForm);
      } else {
        await base44.entities.LearningPath.create({
          ...pathForm,
          teacher_id: user.id,
          is_active: true
        });
      }
      setShowPathModal(false);
      setEditingPath(null);
      setPathForm({ title: "", description: "", subject: "ریاضی", grade: "هفتم", difficulty: "beginner", coins_reward: 100, color: "#8B5CF6" });
      loadData();
    } catch (error) {
      console.error("Error saving path:", error);
    }
  };

  const deletePath = async (pathId) => {
    if (!confirm("آیا مطمئن هستید؟ تمام مراحل این مسیر نیز حذف خواهند شد.")) return;
    try {
      // Delete all stages first
      const pathStages = stages.filter(s => s.path_id === pathId);
      for (const stage of pathStages) {
        await base44.entities.PathStage.delete(stage.id);
      }
      await base44.entities.LearningPath.delete(pathId);
      loadData();
    } catch (error) {
      console.error("Error deleting path:", error);
    }
  };

  const saveStage = async () => {
    try {
      const pathStages = stages.filter(s => s.path_id === selectedPathId);
      const order = editingStage ? editingStage.order : pathStages.length + 1;

      if (editingStage) {
        await base44.entities.PathStage.update(editingStage.id, { ...stageForm, order });
      } else {
        await base44.entities.PathStage.create({
          ...stageForm,
          path_id: selectedPathId,
          order,
          time_limit: stageForm.time_limit ? parseInt(stageForm.time_limit) : null
        });
      }
      setShowStageModal(false);
      setEditingStage(null);
      setStageForm({ title: "", description: "", stage_type: "lesson", content: "", xp_reward: 50, coins_reward: 10, passing_score: 60, time_limit: "" });
      loadData();
    } catch (error) {
      console.error("Error saving stage:", error);
    }
  };

  const deleteStage = async (stageId) => {
    if (!confirm("آیا مطمئن هستید؟")) return;
    try {
      await base44.entities.PathStage.delete(stageId);
      loadData();
    } catch (error) {
      console.error("Error deleting stage:", error);
    }
  };

  const openEditPath = (path) => {
    setEditingPath(path);
    setPathForm({
      title: path.title,
      description: path.description || "",
      subject: path.subject,
      grade: path.grade,
      difficulty: path.difficulty || "beginner",
      coins_reward: path.coins_reward || 100,
      color: path.color || "#8B5CF6"
    });
    setShowPathModal(true);
  };

  const openAddStage = (pathId) => {
    setSelectedPathId(pathId);
    setEditingStage(null);
    setStageForm({ title: "", description: "", stage_type: "lesson", content: "", xp_reward: 50, coins_reward: 10, passing_score: 60, time_limit: "" });
    setShowStageModal(true);
  };

  const openEditStage = (stage) => {
    setSelectedPathId(stage.path_id);
    setEditingStage(stage);
    setStageForm({
      title: stage.title,
      description: stage.description || "",
      stage_type: stage.stage_type,
      content: stage.content || "",
      xp_reward: stage.xp_reward || 50,
      coins_reward: stage.coins_reward || 10,
      passing_score: stage.passing_score || 60,
      time_limit: stage.time_limit?.toString() || ""
    });
    setShowStageModal(true);
  };

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
    <div className="max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Rocket className="w-8 h-8 text-purple-400" />
            مدیریت مسیرهای یادگیری
          </h1>
          <p className="text-gray-400 mt-1">مسیرهای یادگیری گیمیفای شده بسازید</p>
        </div>
        <Button 
          onClick={() => { setEditingPath(null); setPathForm({ title: "", description: "", subject: "ریاضی", grade: "هفتم", difficulty: "beginner", coins_reward: 100, color: "#8B5CF6" }); setShowPathModal(true); }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-5 h-5 ml-2" />
          مسیر جدید
        </Button>
      </div>

      {/* Paths List */}
      {paths.length === 0 ? (
        <Card className="clay-card p-12 text-center">
          <Rocket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">هنوز مسیری نساخته‌اید</h3>
          <p className="text-gray-400 mb-4">اولین مسیر یادگیری خود را بسازید!</p>
          <Button onClick={() => setShowPathModal(true)} className="bg-purple-600">
            <Plus className="w-5 h-5 ml-2" />
            ساخت مسیر
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {paths.map((path) => {
            const pathStages = stages.filter(s => s.path_id === path.id).sort((a, b) => a.order - b.order);
            const isExpanded = expandedPath === path.id;

            return (
              <motion.div key={path.id} layout>
                <Card className="clay-card overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: path.color || '#8B5CF6' }}
                      >
                        🎯
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{path.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge className="bg-purple-600">{path.subject}</Badge>
                          <Badge className="bg-blue-600">{path.grade}</Badge>
                          <Badge className="bg-gray-600">{toPersianNumber(pathStages.length)} مرحله</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEditPath(path); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={(e) => { e.stopPropagation(); deletePath(path.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-700"
                      >
                        <div className="p-4 bg-gray-800/50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-white">مراحل مسیر</h4>
                            <Button size="sm" onClick={() => openAddStage(path.id)} className="bg-green-600 hover:bg-green-700">
                              <Plus className="w-4 h-4 ml-1" />
                              افزودن مرحله
                            </Button>
                          </div>

                          {pathStages.length === 0 ? (
                            <p className="text-gray-400 text-center py-4">هنوز مرحله‌ای اضافه نشده</p>
                          ) : (
                            <div className="space-y-2">
                              {pathStages.map((stage, index) => {
                                const config = stageTypeConfig[stage.stage_type] || stageTypeConfig.lesson;
                                const Icon = config.icon;
                                return (
                                  <div key={stage.id} className="clay-card p-3 flex items-center gap-3">
                                    <GripVertical className="w-4 h-4 text-gray-500" />
                                    <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
                                      <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-gray-400">{toPersianNumber(index + 1)}.</span>
                                    <span className="flex-1 text-white">{stage.title}</span>
                                    <Badge variant="outline">{config.label}</Badge>
                                    <span className="text-yellow-400 text-sm">{toPersianNumber(stage.xp_reward)} XP</span>
                                    <Button size="sm" variant="ghost" onClick={() => openEditStage(stage)}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteStage(stage.id)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Path Modal */}
      <Dialog open={showPathModal} onOpenChange={setShowPathModal}>
        <DialogContent className="clay-card max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPath ? "ویرایش مسیر" : "مسیر جدید"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">عنوان مسیر</label>
              <Input 
                value={pathForm.title}
                onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })}
                placeholder="مثال: ریاضی پایه هفتم - فصل اول"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">توضیحات</label>
              <Textarea 
                value={pathForm.description}
                onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })}
                placeholder="توضیحات مسیر..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">درس</label>
                <Select value={pathForm.subject} onValueChange={(v) => setPathForm({ ...pathForm, subject: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ریاضی">ریاضی</SelectItem>
                    <SelectItem value="علوم">علوم</SelectItem>
                    <SelectItem value="فارسی">فارسی</SelectItem>
                    <SelectItem value="زبان">زبان</SelectItem>
                    <SelectItem value="عربی">عربی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">پایه</label>
                <Select value={pathForm.grade} onValueChange={(v) => setPathForm({ ...pathForm, grade: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="هفتم">هفتم</SelectItem>
                    <SelectItem value="هشتم">هشتم</SelectItem>
                    <SelectItem value="نهم">نهم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">سطح دشواری</label>
                <Select value={pathForm.difficulty} onValueChange={(v) => setPathForm({ ...pathForm, difficulty: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">مبتدی</SelectItem>
                    <SelectItem value="intermediate">متوسط</SelectItem>
                    <SelectItem value="advanced">پیشرفته</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">پاداش تکمیل (سکه)</label>
                <Input 
                  type="number"
                  value={pathForm.coins_reward}
                  onChange={(e) => setPathForm({ ...pathForm, coins_reward: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">رنگ</label>
              <div className="flex gap-2">
                {["#8B5CF6", "#EC4899", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"].map(color => (
                  <button
                    key={color}
                    onClick={() => setPathForm({ ...pathForm, color })}
                    className={`w-8 h-8 rounded-full ${pathForm.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPathModal(false)}>انصراف</Button>
            <Button onClick={savePath} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 ml-2" />
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Modal */}
      <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
        <DialogContent className="clay-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{editingStage ? "ویرایش مرحله" : "مرحله جدید"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">عنوان مرحله</label>
              <Input 
                value={stageForm.title}
                onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })}
                placeholder="مثال: آشنایی با اعداد صحیح"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">توضیحات</label>
              <Textarea 
                value={stageForm.description}
                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                placeholder="توضیح کوتاه..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">نوع مرحله</label>
              <Select value={stageForm.stage_type} onValueChange={(v) => setStageForm({ ...stageForm, stage_type: v })}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson">درس</SelectItem>
                  <SelectItem value="quiz">آزمون</SelectItem>
                  <SelectItem value="assignment">تکلیف</SelectItem>
                  <SelectItem value="challenge">چالش</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {stageForm.stage_type === "lesson" && (
              <div>
                <label className="text-sm text-gray-400 mb-1 block">محتوای درس (Markdown)</label>
                <Textarea 
                  value={stageForm.content}
                  onChange={(e) => setStageForm({ ...stageForm, content: e.target.value })}
                  placeholder="# عنوان&#10;&#10;محتوای درس..."
                  className="bg-gray-800 border-gray-700 min-h-[200px] font-mono text-sm"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">پاداش XP</label>
                <Input 
                  type="number"
                  value={stageForm.xp_reward}
                  onChange={(e) => setStageForm({ ...stageForm, xp_reward: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">پاداش سکه</label>
                <Input 
                  type="number"
                  value={stageForm.coins_reward}
                  onChange={(e) => setStageForm({ ...stageForm, coins_reward: parseInt(e.target.value) || 0 })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            {(stageForm.stage_type === "quiz" || stageForm.stage_type === "challenge") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">حداقل نمره قبولی (%)</label>
                  <Input 
                    type="number"
                    value={stageForm.passing_score}
                    onChange={(e) => setStageForm({ ...stageForm, passing_score: parseInt(e.target.value) || 60 })}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">محدودیت زمانی (دقیقه)</label>
                  <Input 
                    type="number"
                    value={stageForm.time_limit}
                    onChange={(e) => setStageForm({ ...stageForm, time_limit: e.target.value })}
                    placeholder="خالی = بدون محدودیت"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageModal(false)}>انصراف</Button>
            <Button onClick={saveStage} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 ml-2" />
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}