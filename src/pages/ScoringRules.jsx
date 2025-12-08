import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Save, Zap, Clock, Star, Target } from "lucide-react";
import { motion } from "framer-motion";
import { toPersianNumber } from "@/components/utils";
import { toast } from "sonner";

export default function ScoringRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({
    title: "",
    type: "early_submission",
    value: "",
    points: ""
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const user = await base44.auth.me();
      const teacherRules = await base44.entities.ScoringRule.filter({ teacher_id: user.id });
      setRules(teacherRules);
    } catch (error) {
      console.error("Error loading rules:", error);
    }
    setLoading(false);
  };

  const handleCreateRule = async () => {
    if (!newRule.title || !newRule.points || (!newRule.value && newRule.type !== 'perfect_score')) {
      toast.error("لطفا تمام فیلدها را پر کنید");
      return;
    }

    try {
      const user = await base44.auth.me();
      const ruleData = {
        teacher_id: user.id,
        title: newRule.title,
        type: newRule.type,
        value: Number(newRule.value) || 0,
        points: Number(newRule.points),
        is_active: true
      };

      const created = await base44.entities.ScoringRule.create(ruleData);
      setRules([...rules, created]);
      setNewRule({ title: "", type: "early_submission", value: "", points: "" });
      toast.success("قانون جدید با موفقیت ایجاد شد");
    } catch (error) {
      console.error("Error creating rule:", error);
      toast.error("خطا در ایجاد قانون");
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("آیا از حذف این قانون اطمینان دارید؟")) return;
    try {
      await base44.entities.ScoringRule.delete(id);
      setRules(rules.filter(r => r.id !== id));
      toast.success("قانون حذف شد");
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'early_submission': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'perfect_score': return <Star className="w-5 h-5 text-yellow-400" />;
      case 'score_threshold': return <Target className="w-5 h-5 text-green-400" />;
      default: return <Zap className="w-5 h-5 text-purple-400" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'early_submission': return 'ارسال زودهنگام';
      case 'perfect_score': return 'نمره کامل';
      case 'score_threshold': return 'حد نصاب نمره';
      default: return type;
    }
  };

  const getDescription = (rule) => {
    switch (rule.type) {
      case 'early_submission': 
        return `ارسال ${toPersianNumber(rule.value)} ساعت قبل از مهلت`;
      case 'perfect_score': 
        return 'کسب نمره کامل در تکلیف';
      case 'score_threshold': 
        return `کسب حداقل ${toPersianNumber(rule.value)}٪ نمره`;
      default: return '';
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-400" />
          قوانین امتیازدهی هوشمند
        </h1>
        <p className="text-gray-300">
          قوانین خودکار برای اهدای سکه به دانش‌آموزان را تعریف کنید.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="clay-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-400" />
                افزودن قانون جدید
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">عنوان قانون</label>
                <Input
                  placeholder="مثال: جایزه سحرخیز"
                  value={newRule.title}
                  onChange={e => setNewRule({...newRule, title: e.target.value})}
                  className="clay-card text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-1 block">نوع شرط</label>
                <Select 
                  value={newRule.type} 
                  onValueChange={val => setNewRule({...newRule, type: val})}
                >
                  <SelectTrigger className="clay-card text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early_submission">ارسال زودهنگام (ساعت)</SelectItem>
                    <SelectItem value="perfect_score">نمره کامل</SelectItem>
                    <SelectItem value="score_threshold">حد نصاب نمره (درصد)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRule.type !== 'perfect_score' && (
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">
                    {newRule.type === 'early_submission' ? 'حداقل زمان زودتر (ساعت)' : 'حداقل درصد نمره'}
                  </label>
                  <Input
                    type="number"
                    placeholder={newRule.type === 'early_submission' ? "مثلا 24" : "مثلا 90"}
                    value={newRule.value}
                    onChange={e => setNewRule({...newRule, value: e.target.value})}
                    className="clay-card text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-gray-300 mb-1 block">پاداش (سکه)</label>
                <Input
                  type="number"
                  placeholder="مثلا 10"
                  value={newRule.points}
                  onChange={e => setNewRule({...newRule, points: e.target.value})}
                  className="clay-card text-white"
                />
              </div>

              <Button 
                onClick={handleCreateRule} 
                className="w-full clay-button bg-green-600 hover:bg-green-700 text-white mt-4"
              >
                <Save className="w-4 h-4 mr-2" />
                ذخیره قانون
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="clay-card p-4 flex items-center justify-between group hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-slate-900/50">
                    {getIcon(rule.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{rule.title}</h3>
                    <p className="text-sm text-gray-400">{getTypeLabel(rule.type)}</p>
                    <p className="text-xs text-gray-500 mt-1">{getDescription(rule)}</p>
                  </div>
                </div>
                <div className="text-left flex flex-col items-end gap-2">
                  <div className="clay-button px-3 py-1 bg-yellow-500/20 text-yellow-300 text-sm font-bold border-yellow-500/30">
                    {toPersianNumber(rule.points)} سکه
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}

            {rules.length === 0 && (
              <div className="text-center py-12 text-gray-500 clay-card">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>هنوز قانونی تعریف نکرده‌اید.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}