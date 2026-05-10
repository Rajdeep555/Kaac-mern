export const getFinancialYear = () => {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed; April = 3
  const year = now.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}–${String(startYear + 1).slice(2)}`; // e.g. "2025–26"
};

export const formatLastSync = (date) => {
  if (!date) return "Never";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (d.toDateString() === today.toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;

  return (
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) + `, ${time}`
  );
};

export const getSystemStatus = () => {
  return { value: "Operational", dot: "#22c55e", color: "#14532d" };
};

