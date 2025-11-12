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

export function toPersianDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  } catch {
    return '';
  }
}

export function toPersianDateShort(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(d);
  } catch {
    return '';
  }
}

export function toPersianTimeAgo(date) {
  if (!date) return '';
  try {
    const now = new Date();
    const past = new Date(date);
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
    const now = new Date();
    const due = new Date(dueDate);
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
    const now = new Date();
    const due = new Date(dueDate);
    return now > due;
  } catch {
    return false;
  }
}