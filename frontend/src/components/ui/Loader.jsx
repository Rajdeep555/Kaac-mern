import { useState, useEffect } from "react";

const MESSAGES = [
  "Loading data...",
  "Fetching records...",
  "Sorting rows...",
  "Almost there...",
];

// Messages that kick in the longer the wait drags on, so people
// don't start wondering if something broke.
const LONG_WAIT_MESSAGES = [
  { after: 6000, text: "Still working on it..." },
  { after: 12000, text: "This is taking longer than usual..." },
  { after: 20000, text: "Hang tight, large dataset in progress..." },
];

export const Loader = ({
  messages = MESSAGES,
  interval = 2000,
  rows = 5,
  columns = 4,
}) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Rotate through the normal message set.
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 200);
    }, interval);
    return () => clearInterval(timer);
  }, [messages.length, interval]);

  // Track elapsed time so we can escalate messaging on a slow load.
  useEffect(() => {
    const start = Date.now();
    const tick = setInterval(() => setElapsed(Date.now() - start), 500);
    return () => clearInterval(tick);
  }, []);

  const longWaitText = [...LONG_WAIT_MESSAGES]
    .reverse()
    .find((m) => elapsed >= m.after)?.text;

  const displayText = longWaitText ?? messages[index];

  return (
    <div
      className="flex flex-col items-center gap-4 py-10"
      role="status"
      aria-live="polite">
      {/* Skeleton table so people see the shape of what's coming */}
      <div className="w-full max-w-md space-y-2">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-2">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-3 flex-1 rounded bg-gray-200 motion-safe:animate-pulse"
                style={{ animationDelay: `${(r * columns + c) * 60}ms` }}
              />
            ))}
          </div>
        ))}
      </div>

      <span
        className={`text-sm text-gray-500 transition-opacity duration-200 ${
          visible || longWaitText ? "opacity-100" : "opacity-0"
        }`}>
        {displayText}
      </span>
    </div>
  );
};
