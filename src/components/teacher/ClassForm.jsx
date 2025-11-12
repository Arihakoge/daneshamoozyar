import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Class } from "@/entities/Class";

export default function ClassForm({ isOpen, onClose, classData, teacherId }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    grade: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || "",
        description: classData.description || "",
        grade: classData.grade || ""
      });
    } else {
      setFormData({ name: "", description: "", grade: "" });
    }
  }, [classData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (classData) { // Edit mode
        await Class.update(classData.id, formData);
      } else { // Create mode
        await Class.create({ ...formData, teacher_id: teacherId });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save class:", error);
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="clay-card p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {classData ? "ویرایش کلاس" : "ایجاد کلاس جدید"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="نام کلاس (مثلا: ریاضی دهم)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="clay-card"
          />
          <Textarea
            placeholder="توضیحات کوتاه در مورد کلاس"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="clay-card"
          />
          <Input
            placeholder="پایه تحصیلی (مثلا: دهم)"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            className="clay-card"
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 clay-button">
              انصراف
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 clay-button bg-purple-500 text-white">
              {isSubmitting ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}