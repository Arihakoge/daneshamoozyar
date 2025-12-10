import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Star, Shield, Palette, Sparkles, Check, Lock, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toPersianNumber } from "@/components/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function StudentStore() {
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      // Load public profile
      const profiles = await base44.entities.PublicProfile.filter({ user_id: user.id });
      if (profiles.length > 0) setUserProfile(profiles[0]);

      // Load items
      let storeItems = await base44.entities.StoreItem.filter({ is_active: true });
      
      // Auto-seed if empty
      if (storeItems.length === 0) {
        await seedStoreItems();
        storeItems = await base44.entities.StoreItem.filter({ is_active: true });
      }
      
      setItems(storeItems);

      // Load inventory
      const userInventory = await base44.entities.UserInventory.filter({ user_id: user.id });
      setInventory(userInventory);
      
    } catch (error) {
      console.error("Error loading store:", error);
      toast.error("خطا در بارگیری فروشگاه");
    } finally {
      setLoading(false);
    }
  };

  const seedStoreItems = async () => {
    const defaultItems = [
      { name: "آبی آسمانی", description: "رنگ آواتار آبی روشن", cost: 50, type: "avatar_color", value: "#38bdf8", image_url: "" },
      { name: "بنفش سلطنتی", description: "رنگ آواتار بنفش خاص", cost: 100, type: "avatar_color", value: "#7c3aed", image_url: "" },
      { name: "قرمز آتشین", description: "رنگ آواتار قرمز تند", cost: 75, type: "avatar_color", value: "#ef4444", image_url: "" },
      { name: "سبز نئونی", description: "رنگ آواتار سبز درخشان", cost: 150, type: "avatar_color", value: "#4ade80", image_url: "" },
      { name: "دانش‌پژوه", description: "عنوان نمایشی کنار نام", cost: 200, type: "title", value: "دانش‌پژوه", image_url: "" },
      { name: "مبتکر", description: "عنوان نمایشی کنار نام", cost: 300, type: "title", value: "مبتکر", image_url: "" },
      { name: "کادر طلایی", description: "کادر طلایی دور عکس پروفایل", cost: 500, type: "profile_frame", value: "border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]", image_url: "" },
      { name: "کادر نئونی", description: "کادر درخشان دور عکس پروفایل", cost: 600, type: "profile_frame", value: "border-2 border-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse", image_url: "" },
    ];
    
    // Create items sequentially to avoid race conditions if needed, or Promise.all
    for (const item of defaultItems) {
      await base44.entities.StoreItem.create(item);
    }
  };

  const handleBuy = async (item) => {
    if (!userProfile) return;
    if (userProfile.coins < item.cost) {
      toast.error("سکه کافی ندارید!");
      return;
    }

    setPurchasing(item.id);
    try {
      // 1. Deduct coins
      await base44.entities.PublicProfile.update(userProfile.id, {
        coins: userProfile.coins - item.cost
      });

      // 2. Add to inventory
      await base44.entities.UserInventory.create({
        user_id: userProfile.user_id,
        item_id: item.id,
        item_type: item.type,
        purchased_at: new Date().toISOString()
      });

      // 3. Log activity
      await base44.entities.ActivityLog.create({
        user_id: userProfile.user_id,
        activity_type: "purchase",
        points_earned: -item.cost,
        details: `خرید آیتم ${item.name}`
      });

      // Update local state
      setUserProfile(prev => ({ ...prev, coins: prev.coins - item.cost }));
      const newInventoryItem = { item_id: item.id, item_type: item.type }; // simplified
      setInventory(prev => [...prev, newInventoryItem]);
      
      toast.success(`آیتم ${item.name} خریداری شد!`);
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error("خطا در خرید آیتم");
    } finally {
      setPurchasing(null);
    }
  };

  const handleEquip = async (item) => {
    if (!userProfile) return;
    
    setPurchasing(item.id); // Reusing loading state
    try {
      const updateData = {};
      if (item.type === "avatar_color") {
        updateData.avatar_color = item.value;
      } else if (item.type === "profile_frame") {
        updateData.active_frame = item.value;
      } else if (item.type === "title") {
        updateData.active_title = item.value;
      }

      await base44.entities.PublicProfile.update(userProfile.id, updateData);
      
      // Also update auth user for consistency if needed, though PublicProfile is source of truth for display
      await base44.auth.updateMe(updateData);

      setUserProfile(prev => ({ ...prev, ...updateData }));
      toast.success(`${item.name} فعال شد!`);
    } catch (error) {
      console.error("Equip failed:", error);
      toast.error("خطا در فعال‌سازی");
    } finally {
      setPurchasing(null);
    }
  };

  const filteredItems = activeTab === "all" 
    ? items 
    : items.filter(item => item.type === activeTab);

  const getItemIcon = (type) => {
    switch(type) {
      case "avatar_color": return <Palette className="w-5 h-5 text-purple-400" />;
      case "profile_frame": return <Shield className="w-5 h-5 text-yellow-400" />;
      case "title": return <Sparkles className="w-5 h-5 text-blue-400" />;
      default: return <Star className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-pink-500" />
            فروشگاه جوایز
          </h1>
          <p className="text-gray-300">سکه‌های خود را خرج کنید و پروفایل خود را شخصی‌سازی کنید!</p>
        </div>
        
        <div className="clay-card p-4 flex items-center gap-3 bg-slate-900/50 border-purple-500/30">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">موجودی شما</p>
            <p className="text-xl font-bold text-white">{toPersianNumber(userProfile?.coins || 0)} سکه</p>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-slate-800 border border-slate-700 w-full md:w-auto p-1">
          <TabsTrigger value="all" className="flex-1">همه</TabsTrigger>
          <TabsTrigger value="avatar_color" className="flex-1">رنگ‌ها</TabsTrigger>
          <TabsTrigger value="profile_frame" className="flex-1">کادرها</TabsTrigger>
          <TabsTrigger value="title" className="flex-1">عنوان‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => {
                const owned = inventory.some(inv => inv.item_id === item.id);
                const isActive = 
                  (item.type === "avatar_color" && userProfile?.avatar_color === item.value) ||
                  (item.type === "profile_frame" && userProfile?.active_frame === item.value) ||
                  (item.type === "title" && userProfile?.active_title === item.value);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`clay-card h-full flex flex-col ${isActive ? 'border-2 border-green-500' : ''}`}>
                      <CardContent className="p-6 flex flex-col h-full items-center text-center relative overflow-hidden">
                        {isActive && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg z-10">
                            فعال
                          </div>
                        )}
                        
                        <div className="w-24 h-24 mb-4 rounded-full bg-slate-800 flex items-center justify-center relative group">
                          {item.type === "avatar_color" && (
                            <div className="w-20 h-20 rounded-full shadow-inner" style={{ backgroundColor: item.value }} />
                          )}
                          {item.type === "profile_frame" && (
                            <div className={`w-20 h-20 rounded-full bg-slate-700 ${item.value}`} />
                          )}
                          {item.type === "title" && (
                            <div className="px-3 py-1 bg-slate-700 rounded-lg text-white font-bold text-sm">
                              {item.value}
                            </div>
                          )}
                          
                          {/* Preview tooltip logic could go here */}
                          <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-2 border border-slate-700">
                             {getItemIcon(item.type)}
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{item.description}</p>

                        <div className="mt-auto w-full">
                          {owned ? (
                            isActive ? (
                              <Button disabled className="w-full bg-slate-700 text-slate-400 cursor-not-allowed">
                                <Check className="w-4 h-4 mr-2" /> فعال است
                              </Button>
                            ) : (
                              <Button 
                                onClick={() => handleEquip(item)} 
                                disabled={purchasing === item.id}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white clay-button"
                              >
                                {purchasing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "استفاده"}
                              </Button>
                            )
                          ) : (
                            <Button 
                              onClick={() => handleBuy(item)} 
                              disabled={purchasing === item.id || (userProfile?.coins || 0) < item.cost}
                              className={`w-full clay-button ${
                                (userProfile?.coins || 0) >= item.cost 
                                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                                  : "bg-slate-700 text-slate-500 hover:bg-slate-700 cursor-not-allowed"
                              }`}
                            >
                              {purchasing === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  {item.cost > (userProfile?.coins || 0) ? <Lock className="w-4 h-4 mr-2" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                                  {toPersianNumber(item.cost)} سکه
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}