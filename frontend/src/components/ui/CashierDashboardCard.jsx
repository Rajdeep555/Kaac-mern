import React from "react";

import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
const CashierDashboardCard = ({
  title,
  count,
  paragraph,
  difference,
  bg = true,
}) => {
  const isPositive = difference >= 0;
  return (
    <div
      className={`col-span-3 h-28 w-full cursor-pointer hover:shadow-md transition-all ease-in-out duration-200 rounded-3xl px-5 py-2 flex flex-col justify-center gap-1 ${bg ? "bg-zinc-100" : "bg-linear-to-b from-green-200 to-green-100"}`}>
      <span className="text-sm font-unbounded">{title}</span>
      <span className="font-unbounded text-2xl">{count}</span>
      <span
        className={`flex items-center gap-1 font-inter text-sm ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}>
        {isPositive ? <FaArrowTrendUp /> : <FaArrowTrendDown />}
        {Math.abs(difference)}
        <span className="text-black">{paragraph}</span>
      </span>
    </div>
  );
};

export default CashierDashboardCard;
