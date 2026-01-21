import React from "react";

const FilterOptionButton = ({ title, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full cursor-pointer font-unbounded font-normal text-sm flex items-center justify-center transition-colors ${selected ? "bg-active" : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300"}`}>
      {title}
    </button>
  );
};

export default FilterOptionButton;
