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
