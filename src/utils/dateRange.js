function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange(period, currentDate = new Date(), selection = {}) {
  const start = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const end = new Date(start);

  if (period === 'all') {
    return { startDate: '0000-01-01', endDate: '9999-12-31' };
  }
  if (period === 'week') {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 6);
  } else if (period === 'month') {
    const month = selection.month ?? currentDate.getMonth();
    const year = selection.year ?? currentDate.getFullYear();
    start.setFullYear(year, month, 1);
    end.setFullYear(year, month + 1, 0);
  } else if (period === 'year') {
    const year = selection.year ?? currentDate.getFullYear();
    start.setFullYear(year, 0, 1);
    end.setFullYear(year, 11, 31);
  }

  return { startDate: toDateString(start), endDate: toDateString(end) };
}

export function formatDateRange({ startDate, endDate }) {
  const formatDate = value => new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}
