import React, { useState } from "react";
import { useGreeting } from "../../hooks/useGreeting";
import { useAuth } from "../../context/AuthContext";
import { capitalizeFullName } from "../../utils/string";
import FilterOptionButton from "../../components/ui/FilterOptionButton";
import DateRangePill from "../../components/ui/DateRangePill";

import CashierDashboardCard from "../../components/ui/CashierDashboardCard";

const CashierDashboard = () => {
  const greetings = useGreeting();
  const { user } = useAuth();

  const [filter, setFilter] = useState("Day");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });

  const handleFilterClick = (item) => {
    setFilter(item);
    setDateRange({ from: "", to: "" });
  };

  const handleDateChange = (range) => {
    setDateRange(range);

    if (range.from && range.to) {
      setFilter(null);
    }
  };

  return (
    <div className="px-4 py-1">
      <span className="text-xl font-unbounded">
        {greetings}, {capitalizeFullName(user.name)}
      </span>

      <p className="text-base text-gray-700 font-inter">
        Here is an overview of activities.
      </p>

      <div className="h-10 w-full flex items-center justify-end gap-3 border-b border-gray-100">
        {["Day", "Week", "Month", "Year"].map((item) => (
          <FilterOptionButton
            key={item}
            title={item}
            selected={filter === item}
            onClick={() => handleFilterClick(item)}
          />
        ))}

        <DateRangePill
          value={dateRange}
          onChange={handleDateChange}
          active={!filter && dateRange.from && dateRange.to}
        />
      </div>

      {/* dashboard data  */}
      <div className="grid grid-cols-12 items-center gap-4 mt-2">
        <CashierDashboardCard
          bg={false}
          title="Council's Challan"
          count="100"
          paragraph="from yesterday"
          difference={10 - 100}
        />

        <CashierDashboardCard
          title="Council's Expenditure"
          count="20"
          paragraph="from yesterday"
          difference={100 - 39}
        />

        <CashierDashboardCard
          title="State's Challan"
          count="12"
          paragraph="from yesterday"
          difference={200 - 39}
        />

        <CashierDashboardCard
          title="State's Expenditure"
          count="66"
          paragraph="from yesterday"
          difference={1 - 39}
        />
      </div>
    </div>
  );
};

export default CashierDashboard;
