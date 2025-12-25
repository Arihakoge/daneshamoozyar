export function createPageUrl(pageName, params = {}) {
  const queryString = Object.keys(params).length > 0 
    ? '?' + new URLSearchParams(params).toString() 
    : '';
  return `/${pageName}${queryString}`;
}

export function toPersianNumber(num) {
  if (num === null || num === undefined) return '۰';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, x => persianDigits[parseInt(x)]);
}

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

const persianMonthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export function toPersianDate(date) {
  if (!date) return '';
  try {
    let dateStr = date;
    if (typeof date === 'string' && !date.includes('Z') && !date.match(/[+-]\d{2}:?\d{2}$/)) {
        dateStr += 'Z';
    }
    const d = new Date(dateStr);
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersianNumber(jd)} ${persianMonthNames[jm - 1]} ${toPersianNumber(jy)}`;
  } catch {
    return '';
  }
}

export function toPersianDateShort(date) {
  if (!date) return '';
  try {
    let dateStr = date;
    if (typeof date === 'string' && !date.includes('Z') && !date.match(/[+-]\d{2}:?\d{2}$/)) {
        dateStr += 'Z';
    }
    const d = new Date(dateStr);
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${toPersianNumber(jd)} ${persianMonthNames[jm - 1]}`;
  } catch {
    return '';
  }
}

export function toPersianTimeAgo(date) {
  if (!date) return '';
  try {
    const now = new Date();
    
    let dateStr = date;
    if (typeof date === 'string' && !date.includes('Z') && !date.match(/[+-]\d{2}:?\d{2}$/)) {
        dateStr += 'Z';
    }
    
    const past = new Date(dateStr);
    const diff = now - past;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${toPersianNumber(days)} روز پیش`;
    if (hours > 0) return `${toPersianNumber(hours)} ساعت پیش`;
    if (minutes > 0) return `${toPersianNumber(minutes)} دقیقه پیش`;
    return 'همین الان';
  } catch {
    return '';
  }
}

export function formatDaysRemaining(dueDate) {
  if (!dueDate) return '';
  try {
    let dateStr = dueDate;
    if (typeof dueDate === 'string' && !dueDate.includes('Z') && !dueDate.match(/[+-]\d{2}:?\d{2}$/)) {
        dateStr += 'Z';
    }
    const now = new Date();
    const due = new Date(dateStr);
    const diff = due - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return 'مهلت گذشته';
    if (days === 0) return 'امروز';
    if (days === 1) return 'فردا';
    return `${toPersianNumber(days)} روز مانده`;
  } catch {
    return '';
  }
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  try {
    let dateStr = dueDate;
    if (typeof dueDate === 'string' && !dueDate.includes('Z') && !dueDate.match(/[+-]\d{2}:?\d{2}$/)) {
        dateStr += 'Z';
    }
    const now = new Date();
    const due = new Date(dateStr);
    return now > due;
  } catch {
    return false;
  }
}

export function normalizeScore(score, maxScore) {
  if (score === null || score === undefined) return 0;
  const max = maxScore || 20; // Default to 20 if maxScore is missing or 0
  if (max === 0) return 0; // Avoid division by zero
  return (score / max) * 20;
}

export function calculateStreak(submissions) {
  if (!submissions || submissions.length === 0) {
    return { current: 0, longest: 0, weeklyActivity: [false, false, false, false, false, false, false] };
  }

  const dates = [...new Set(submissions.map(s => new Date(s.created_date).toDateString()))]
    .sort((a, b) => new Date(b) - new Date(a));

  const today = new Date();
  const todayStr = today.toDateString();
  const yesterdayStr = new Date(today.getTime() - 86400000).toDateString();

  let currentStreak = 0;
  if (dates.includes(todayStr) || dates.includes(yesterdayStr)) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / 86400000;
      if (Math.round(diff) === 1) currentStreak++;
      else break;
    }
  }

  let longestStreak = currentStreak;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / 86400000;
    if (Math.round(diff) === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  const weeklyActivity = [];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() - 1);
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    weeklyActivity.push(dates.includes(day.toDateString()));
  }

  return { current: currentStreak, longest: longestStreak, weeklyActivity };
}

export function generateGoogleCalendarUrl(assignment) {
  try {
    if (!assignment || !assignment.due_date) return '#';
    
    const dueDate = new Date(assignment.due_date);
    if (isNaN(dueDate.getTime())) return '#';

    // Start time: 1 hour before due date
    const end = dueDate;
    const start = new Date(dueDate.getTime() - 60 * 60 * 1000); 

    const formatDate = (date) => {
      try {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      } catch (e) {
        return '';
      }
    };

    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);
    
    if (!startDateStr || !endDateStr) return '#';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `تکلیف: ${assignment.title || 'بدون عنوان'}`,
      details: `${assignment.description || ''}\n\nدرس: ${assignment.subject || ''}\nحداکثر نمره: ${assignment.max_score || 0}`,
      dates: `${startDateStr}/${endDateStr}`,
      location: 'مدرسه',
      trp: 'false'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (error) {
    console.error("Error generating calendar URL:", error);
    return '#';
  }
}