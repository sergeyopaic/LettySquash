export const formatMatchDateGroup = (dateStr: string): string => {
  const matchDate = new Date(dateStr);
  const now = new Date();

  const isToday =
    matchDate.getDate() === now.getDate() &&
    matchDate.getMonth() === now.getMonth() &&
    matchDate.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    matchDate.getDate() === yesterday.getDate() &&
    matchDate.getMonth() === yesterday.getMonth() &&
    matchDate.getFullYear() === yesterday.getFullYear();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  const day = matchDate.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = monthNames[matchDate.getMonth()];
  const year = matchDate.getFullYear();

  return year === now.getFullYear() ? `${day} ${month}` : `${day} ${month} ${year}`;
};

export const formatMatchTime = (dateStr: string): string => {
  const matchDate = new Date(dateStr);
  const hours = String(matchDate.getHours()).padStart(2, '0');
  const mins = String(matchDate.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
};

export const formatFullDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins}`;
};

export const formatMatchDuration = (totalSec: number = 0): string => {
  if (!totalSec || totalSec <= 0) return '< 1 min';
  if (totalSec < 60) return `${totalSec} sec`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return secs > 0 ? `${mins} min ${secs}s` : `${mins} min`;
};

export const getMatchDurationParts = (totalSec: number = 0): { val: string; unit: string } => {
  if (!totalSec || totalSec <= 0) return { val: '< 1', unit: 'min' };
  if (totalSec < 60) return { val: String(totalSec), unit: 'sec' };
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (secs > 0) return { val: String(mins), unit: `min ${secs}s` };
  return { val: String(mins), unit: 'min' };
};

