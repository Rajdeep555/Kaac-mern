import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DateRangePickerPill = ({ value, onChange, active }) => {
  const { from, to } = value;
  const hasValue = from && to;

  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const clearRange = (e) => {
    e.stopPropagation();
    onChange({ from: null, to: null });
  };

  return (
    <DatePicker
      selectsRange
      startDate={from}
      endDate={to}
      onChange={([start, end]) => onChange({ from: start, to: end })}
      maxDate={new Date()}
      dateFormat="dd MMM yyyy"
      isClearable={false}
      customInput={
        <div
          className={` px-3 py-1.5 rounded-full font-unbounded text-sm flex items-center gap-2 cursor-pointer hover:bg-zinc-300 transition-colors ${active ? "bg-active text-black" : "bg-zinc-200 hover:bg-zinc-300"}`}>
          📅
          <span>
            {hasValue
              ? `${formatDate(from)} – ${formatDate(to)}`
              : "Select date range"}
          </span>
          {hasValue && (
            <button
              onClick={clearRange}
              className="ml-1 text-red-600 hover:text-red-800 cursor-pointer">
              ✕
            </button>
          )}
        </div>
      }
    />
  );
};

export default DateRangePickerPill;
