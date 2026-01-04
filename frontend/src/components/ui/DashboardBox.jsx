import React from "react";

const DashboardBox = ({ items = [] }) => {
  return (
    <div className="h-62 w-4/12 shadow-[0_0px_15px_rgba(0,0,0,0.12)] rounded-xl flex flex-col gap-3">
      <div className="h-1/2 w-ful flex items-center justify-between  px-3 pt-3 gap-3">
        {items.slice(0, 2).map((item, i) => (
          <InnerDiv key={i} {...item} isFirst={i===0} />
        ))}
      </div>
      <div className="h-1/2 w-ful flex items-center justify-between px-3 pb-3 gap-3">
        {items.slice(2, 4).map((item, i) => (
          <InnerDiv key={i} {...item} />
        ))}
      </div>
    </div>
  );
};

export default DashboardBox;

export const InnerDiv = ({ title, count, paragraph, icon, isFirst }) => {
  return (
    <div className={`h-full w-full p-3 rounded-xl flex flex-col justify-between ${isFirst ? "bg-green-300" : "bg-[#e6e5e5]"}`}>
      <div className="flex items-center justify-between w-full">
        <h3 className="font-unbounded">{title}</h3>
        <span className="">{icon}</span>
      </div>

      <div>
        <span className="text-2xl font-unbounded">{count}</span>
        <p className="text-xs font-inter text-gray-700">{paragraph}</p>
      </div>
    </div>
  );
};
