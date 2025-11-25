import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Persian month names
const persianMonths = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const persianDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

// Convert Gregorian to Jalali
function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * (Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * (Math.floor(days / 1461));
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

// Convert Jalali to Gregorian
function jalaliToGregorian(jy, jm, jd) {
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + ((Math.floor(jy / 33)) * 8) + (Math.floor(((jy % 33) + 3) / 4)) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * (Math.floor(days / 146097));
  days %= 146097;
  if (days > 36524) {
    gy += 100 * (Math.floor(--days / 36524));
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * (Math.floor(days / 1461));
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  let v = 0;
  for (gm = 0; gm < 13 && v < gd; gm++) v += sal_a[gm];
  return [gy, gm - 1, gd - v + sal_a[gm - 1]];
}

// Check if Jalali year is leap
function isJalaliLeap(jy) {
  const breaks = [1, 5, 9, 13, 17, 22, 26, 30];
  const cycle = jy % 33;
  return breaks.includes(cycle);
}

// Get days in Jalali month
function getJalaliMonthDays(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

// Get first day of Jalali month (0 = Saturday)
function getFirstDayOfJalaliMonth(jy, jm) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
  const date = new Date(gy, gm - 1, gd);
  const day = date.getDay();
  // Convert to Persian week (Saturday = 0)
  return (day + 1) % 7;
}

function toPersianDigits(num) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, x => persianDigits[parseInt(x)]);
}

export default function PersianDatePicker({ value, onChange, placeholder = "انتخاب تاریخ" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(1403);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    // Initialize with today's date in Jalali
    const today = new Date();
    const [jy, jm, jd] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    setCurrentYear(jy);
    setCurrentMonth(jm);

    // If value exists, parse it
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const [vjy, vjm, vjd] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
        setSelectedDate({ year: vjy, month: vjm, day: vjd });
        setCurrentYear(vjy);
        setCurrentMonth(vjm);
      }
    }
  }, [value]);

  const handleDateSelect = (day) => {
    const newSelected = { year: currentYear, month: currentMonth, day };
    setSelectedDate(newSelected);
    
    // Convert to Gregorian and create ISO date string
    const [gy, gm, gd] = jalaliToGregorian(currentYear, currentMonth, day);
    const gregorianDate = new Date(gy, gm - 1, gd);
    const isoString = gregorianDate.toISOString().split('T')[0];
    
    onChange(isoString);
    setIsOpen(false);
  };

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getJalaliMonthDays(currentYear, currentMonth);
  const firstDay = getFirstDayOfJalaliMonth(currentYear, currentMonth);

  const displayValue = selectedDate
    ? `${toPersianDigits(selectedDate.day)} ${persianMonths[selectedDate.month - 1]} ${toPersianDigits(selectedDate.year)}`
    : placeholder;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-right clay-card border-0"
      >
        <span className={selectedDate ? "text-white" : "text-gray-400"}>
          {displayValue}
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 p-4 clay-card bg-gray-900 rounded-xl shadow-xl w-72"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
                className="text-white hover:bg-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              <div className="text-center">
                <span className="font-bold text-white text-lg">
                  {persianMonths[currentMonth - 1]} {toPersianDigits(currentYear)}
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goToPrevMonth}
                className="text-white hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {persianDays.map((day) => (
                <div key={day} className="text-center text-xs text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = selectedDate &&
                  selectedDate.year === currentYear &&
                  selectedDate.month === currentMonth &&
                  selectedDate.day === day;

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`p-2 text-center rounded-lg transition-colors ${
                      isSelected
                        ? "bg-purple-500 text-white font-bold"
                        : "text-white hover:bg-gray-700"
                    }`}
                  >
                    {toPersianDigits(day)}
                  </button>
                );
              })}
            </div>

            {/* Today button */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const today = new Date();
                  const [jy, jm, jd] = gregorianToJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
                  setCurrentYear(jy);
                  setCurrentMonth(jm);
                  handleDateSelect(jd);
                }}
                className="w-full text-purple-400 hover:text-purple-300"
              >
                امروز
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { gregorianToJalali, jalaliToGregorian, persianMonths, toPersianDigits };