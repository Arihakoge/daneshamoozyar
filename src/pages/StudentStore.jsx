import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Zap, Shield, Lock, Coins, Loader2, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toPersianNumber } from "@/components/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { calculateLevel } from "@/components/gamification/LevelSystem";

export default function StudentStore() {
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [activeTab, setActiveTab] = useState("powerup");

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      const user = await base44.auth.me();
      
      const profiles = await base44.entities.PublicProfile.filter({ user_id: user.id });
      if (profiles.length > 0) {
        // Migration: If total_xp is 0 but has coins/level, initialize it roughly
        let profile = profiles[0];
        if (!profile.total_xp && profile.coins > 0) {
           const estimatedXP = profile.coins * 2; // Rough estimate
           await base44.entities.PublicProfile.update(profile.id, { total_xp: estimatedXP });
           profile.total_xp = estimatedXP;
        }
        setUserProfile(profile);
      }

      let storeItems = await base44.entities.StoreItem.filter({ is_active: true });
      
      // Auto-seed if we need to update items or if empty (Checking if we have powerups)
      const hasPowerups = storeItems.some(i => i.type === 'powerup');
      if (storeItems.length === 0 || !hasPowerups) {
        await seedStoreItems();
        storeItems = await base44.entities.StoreItem.filter({ is_active: true });
      }
      
      setItems(storeItems);

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
    // Clear old items first if needed? For now just create new ones.
    const newItems = [
      // Powerups
      { 
        name: "ماشین زمان (۲ روز)", 
        description: "مهلت ارسال تکلیف را ۲ روز تمدید می‌کند.", 
        cost: 150, 
        type: "powerup", 
        value: JSON.stringify({ effect: "extend_deadline", days: 2 }), 
        duration_hours: 168,
        min_level: 1,
        image_url: "" 
      },
      { 
        name: "ماشین زمان (۱ هفته)", 
        description: "مهلت ارسال تکلیف را یک هفته تمدید می‌کند.", 
        cost: 400, 
        type: "powerup", 
        value: JSON.stringify({ effect: "extend_deadline", days: 7 }), 
        duration_hours: 168,
        min_level: 5,
        image_url: "" 
      },
      { 
        name: "ضریب سکه (۲ برابر)", 
        description: "سکه دریافتی از تکلیف بعدی را ۲ برابر می‌کند.", 
        cost: 100, 
        type: "powerup", 
        value: JSON.stringify({ effect: "double_coins" }), 
        duration_hours: 0, // Consumable on use
        min_level: 2,
        image_url: "" 
      },
      { 
        name: "معجون تجربه (۲ برابر)", 
        description: "امتیاز تجربه (XP) تکلیف بعدی را ۲ برابر می‌کند.", 
        cost: 100, 
        type: "powerup", 
        value: JSON.stringify({ effect: "double_xp" }), 
        duration_hours: 0,
        min_level: 2,
        image_url: "" 
      },
      { 
        name: "سپر محافظ استریک", 
        description: "اگر یک روز تمرین ارسال نکنید، زنجیره فعالیت شما قطع نمی‌شود.", 
        cost: 300, 
        type: "powerup", 
        value: JSON.stringify({ effect: "freeze_streak" }), 
        duration_hours: 24,
        min_level: 3,
        image_url: "" 
      },
      { 
        name: "حذف جریمه تاخیر", 
        description: "جریمه کسر نمره برای ارسال دیر هنگام را حذف می‌کند.", 
        cost: 250, 
        type: "powerup", 
        value: JSON.stringify({ effect: "remove_late_penalty" }), 
        duration_hours: 0,
        min_level: 4,
        image_url: "" 
      },
      
      // Frames
      { name: "کادر برنزی", description: "یک کادر ساده و شیک", cost: 50, type: "profile_frame", value: "border-4 border-orange-700", min_level: 1, image_url: "" },
      { name: "کادر نقره‌ای", description: "نشانه پیشرفت", cost: 150, type: "profile_frame", value: "border-4 border-slate-300 shadow-md", min_level: 2, image_url: "" },
      { name: "کادر طلایی", description: "برای بهترین‌ها", cost: 500, type: "profile_frame", value: "border-4 border-yellow-400 shadow-lg shadow-yellow-500/50", min_level: 5, image_url: "" },
      { name: "کادر نئونی آبی", description: "درخشش خیره کننده", cost: 800, type: "profile_frame", value: "border-2 border-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse", min_level: 8, image_url: "" },
      { name: "کادر آتشین", description: "قدرت خالص", cost: 1000, type: "profile_frame", value: "border-4 border-red-500 shadow-[0_0_20px_#ef4444]", min_level: 10, image_url: "" },
      { name: "کادر رنگین‌کمان", description: "بسیار کمیاب", cost: 2000, type: "profile_frame", value: "bg-gradient-to-r from-red-500 via-green-500 to-blue-500 p-1 rounded-full", min_level: 15, image_url: "" },
    ];
    
    // Check existence and create
    const existing = await base44.entities.StoreItem.list();
    for (const item of newItems) {
      if (!existing.find(e => e.name === item.name)) {
        await base44.entities.StoreItem.create(item);
      }
    }
  };

  const handleBuy = async (item) => {
    if (!userProfile) return;
    if (userProfile.coins < item.cost) {
      toast.error("سکه کافی ندارید!");
      return;
    }
    
    // Level Check
    const { level } = calculateLevel(userProfile.total_xp);
    if (level < (item.min_level || 1)) {
       toast.error(`برای خرید این آیتم باید به سطح ${toPersianNumber(item.min_level)} برسید!`);
       return;
    }

    setPurchasing(item.id);
    try {
      // 1. Deduct coins
      await base44.entities.PublicProfile.update(userProfile.id, {
        coins: userProfile.coins - item.cost
      });

      // 2. Add to inventory
      const createdItem = await base44.entities.UserInventory.create({
        user_id: userProfile.user_id,
        item_id: item.id,
        item_type: item.type,
        purchased_at: new Date().toISOString(),
        is_active: false // Powerups start inactive, Frames bought
      });

      // 3. Log activity
      await base44.entities.ActivityLog.create({
        user_id: userProfile.user_id,
        activity_type: "purchase",
        points_earned: -item.cost,
        details: `خرید ${item.name}`
      });

      setUserProfile(prev => ({ ...prev, coins: prev.coins - item.cost }));
      setInventory(prev => [...prev, createdItem]);
      
      toast.success(`${item.name} خریداری شد!`);
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error("خطا در خرید آیتم");
    } finally {
      setPurchasing(null);
    }
  };

  const handleActivatePowerup = async (item) => {
      // Find inactive inventory item
      const inventoryItem = inventory.find(inv => inv.item_id === item.id && !inv.is_active);
      if (!inventoryItem) return;

      setPurchasing(item.id);
      try {
        const now = new Date();
        // If duration is 0, it's "next assignment" type, usually tracked by is_active=true and consumed on submission
        // We set expiration to far future or just handle logic elsewhere.
        // Let's set expiration to 1 year if 0, logic will consume it.
        const duration = item.duration_hours > 0 ? item.duration_hours : 8760; 
        const expiresAt = new Date(now.getTime() + (duration * 60 * 60 * 1000));
        
        await base44.entities.UserInventory.update(inventoryItem.id, {
          is_active: true,
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString()
        });

        setInventory(prev => prev.map(inv => 
          inv.id === inventoryItem.id 
            ? { ...inv, is_active: true, activated_at: now.toISOString(), expires_at: expiresAt.toISOString() } 
            : inv
        ));
        
        toast.success(`${item.name} فعال شد!`);
      } catch (error) {
        console.error("Activation failed:", error);
        toast.error("خطا در فعال‌سازی");
      } finally {
        setPurchasing(null);
      }
  };

  const handleEquipFrame = async (item) => {
    if (!userProfile) return;
    setPurchasing(item.id);
    try {
      const updateData = { active_frame: item.value };
      await base44.entities.PublicProfile.update(userProfile.id, updateData);
      await base44.auth.updateMe(updateData);
      setUserProfile(prev => ({ ...prev, ...updateData }));
      toast.success(`${item.name} روی پروفایل قرار گرفت!`);
    } catch (error) {
        toast.error("خطا در تغییر فریم");
    } finally {
        setPurchasing(null);
    }
  };

  const filteredItems = items.filter(item => item.type === activeTab).sort((a,b) => a.cost - b.cost);
  const currentLevel = userProfile ? calculateLevel(userProfile.total_xp).level : 1;

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
            فروشگاه قدرت و افتخار
          </h1>
          <p className="text-gray-300">با پیشرفت در درس‌ها، قدرت‌های جدید آزاد کنید!</p>
        </div>
        
        <div className="flex gap-4">
             <div className="clay-card p-4 flex items-center gap-3 bg-slate-900/50 border-purple-500/30">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ArrowUpCircle className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <p className="text-xs text-gray-400">سطح شما</p>
                    <p className="text-xl font-bold text-white">{toPersianNumber(currentLevel)}</p>
                </div>
            </div>
            <div className="clay-card p-4 flex items-center gap-3 bg-slate-900/50 border-purple-500/30">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                    <p className="text-xs text-gray-400">موجودی</p>
                    <p className="text-xl font-bold text-white">{toPersianNumber(userProfile?.coins || 0)} سکه</p>
                </div>
            </div>
        </div>
      </motion.div>

      <Tabs defaultValue="powerup" onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-slate-800 border border-slate-700 w-full md:w-auto p-1">
          <TabsTrigger value="powerup" className="flex-1 px-8">⚡ قدرت‌ها</TabsTrigger>
          <TabsTrigger value="profile_frame" className="flex-1 px-8">🛡️ فریم‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, index) => {
                const inventoryItems = inventory.filter(inv => inv.item_id === item.id);
                const ownedCount = inventoryItems.length;
                
                // Active check for frames
                const isEquipped = item.type === "profile_frame" && userProfile?.active_frame === item.value;
                
                // Active check for powerups
                const activePowerup = item.type === "powerup" && inventoryItems.some(inv => inv.is_active && new Date(inv.expires_at) > new Date());

                const isLocked = currentLevel < (item.min_level || 1);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`clay-card h-full flex flex-col relative overflow-hidden ${isEquipped || activePowerup ? 'border-2 border-green-500' : isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                      {isLocked && (
                          <div className="absolute inset-0 bg-black/60 z-10 flex flex-col items-center justify-center text-center p-4">
                              <Lock className="w-12 h-12 text-gray-400 mb-2" />
                              <p className="text-white font-bold">قفل شده</p>
                              <p className="text-sm text-gray-300">نیاز به سطح {toPersianNumber(item.min_level)}</p>
                          </div>
                      )}
                      
                      <CardContent className="p-6 flex flex-col h-full items-center text-center">
                        <div className="w-20 h-20 mb-4 rounded-full bg-slate-800 flex items-center justify-center relative">
                          {item.type === "profile_frame" ? (
                              <div className={`w-16 h-16 rounded-full bg-slate-700 ${item.value}`} />
                          ) : (
                              <Zap className="w-10 h-10 text-orange-400" />
                          )}
                          
                           {ownedCount > 0 && item.type === "powerup" && (
                              <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-slate-900 z-20">
                                  {toPersianNumber(ownedCount)}
                              </div>
                           )}
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                        <p className="text-xs text-gray-400 mb-6 flex-1">{item.description}</p>

                        <div className="w-full mt-auto">
                           {item.type === "profile_frame" ? (
                               ownedCount > 0 ? (
                                   isEquipped ? (
                                       <Button disabled className="w-full bg-slate-700 text-slate-300">
                                           فعال است
                                       </Button>
                                   ) : (
                                       <Button onClick={() => handleEquipFrame(item)} disabled={purchasing === item.id} className="w-full bg-blue-600 hover:bg-blue-700 text-white clay-button">
                                           {purchasing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "تجهیز"}
                                       </Button>
                                   )
                               ) : (
                                   <Button onClick={() => handleBuy(item)} disabled={isLocked || purchasing === item.id} className="w-full bg-purple-600 hover:bg-purple-700 text-white clay-button">
                                       {purchasing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShoppingBag className="w-4 h-4 mr-2" /> {toPersianNumber(item.cost)} سکه</>}
                                   </Button>
                               )
                           ) : (
                               // Powerups
                               <div className="flex flex-col gap-2 w-full">
                                   {activePowerup ? (
                                       <Button disabled className="w-full bg-green-900/50 text-green-400 border border-green-500/30">
                                           <Zap className="w-4 h-4 mr-2 animate-pulse" /> در حال اجرا
                                       </Button>
                                   ) : (
                                       inventoryItems.some(inv => !inv.is_active) ? (
                                           <Button onClick={() => handleActivatePowerup(item)} disabled={purchasing === item.id} className="w-full bg-green-600 hover:bg-green-700 text-white clay-button">
                                               {purchasing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "فعال‌سازی"}
                                           </Button>
                                       ) : null
                                   )}
                                   
                                   <Button onClick={() => handleBuy(item)} disabled={isLocked || purchasing === item.id} variant={ownedCount > 0 ? "outline" : "default"} className={`w-full clay-button ${ownedCount > 0 ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                                       {purchasing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{ownedCount > 0 ? "خرید بیشتر" : "خرید"} ({toPersianNumber(item.cost)} سکه)</>}
                                   </Button>
                               </div>
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