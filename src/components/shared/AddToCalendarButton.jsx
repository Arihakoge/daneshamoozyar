import React, { useState } from "react";
import { Calendar, Check, Loader2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function AddToCalendarButton({ assignment, className, variant = "ghost" }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSync = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("manageCalendar", {
        action: "sync_google",
        assignment_id: assignment.id
      });
      
      const data = response.data;

      if (data.error) {
        if (data.code === 'AUTH_REQUIRED' || response.status === 403) {
            try {
                await base44.appConnectors.requestAuth({
                    integration_type: 'googlecalendar',
                    reason: 'برای افزودن تکلیف به تقویم گوگل شما',
                    scopes: ['https://www.googleapis.com/auth/calendar.events']
                });
                toast.success("در حال انتقال به صفحه مجوزدهی...");
            } catch(e) {
                toast.error("خطا در درخواست مجوز");
            }
        } else {
            toast.error(data.details || "خطا در اتصال به تقویم گوگل");
        }
      } else {
        toast.success(data.action === 'updated' ? "تکلیف در تقویم بروزرسانی شد" : "تکلیف به تقویم گوگل اضافه شد");
      }
    } catch (error) {
       console.error(error);
       if (error.response?.status === 403) {
          try {
                await base44.appConnectors.requestAuth({
                    integration_type: 'googlecalendar',
                    reason: 'برای افزودن تکلیف به تقویم گوگل شما',
                    scopes: ['https://www.googleapis.com/auth/calendar.events']
                });
            } catch(e) {}
       } else {
          toast.error("خطا در عملیات");
       }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadICS = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke("manageCalendar", {
        action: "get_ics",
        assignment_id: assignment.id
      });
      
      const data = response.data;
      if (data.success && data.ics_content) {
          const blob = new Blob([data.ics_content], { type: 'text/calendar;charset=utf-8' });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.setAttribute('download', `assignment-${assignment.id}.ics`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success("فایل تقویم دانلود شد");
      } else {
          toast.error("خطا در تولید فایل تقویم");
      }
    } catch (error) {
      console.error(error);
      toast.error("خطا در دانلود");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            variant={variant} 
            size="sm" 
            className={`${className} gap-2`}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            <span>افزودن به تقویم</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DropdownMenuItem onClick={handleGoogleSync} className="cursor-pointer gap-2">
            <ExternalLink className="w-4 h-4 text-blue-500" />
            <span>Google Calendar</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS} className="cursor-pointer gap-2">
            <Download className="w-4 h-4 text-orange-500" />
            <span>Apple / Outlook (.ics)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}