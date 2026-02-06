import React, { useEffect, useState } from "react";
import DashboardBox from "../../components/ui/DashboardBox";
import { useAuth } from "../../context/AuthContext";
import { capitalizeFullName } from "../../utils/string.js";
import { useGreeting } from "../../hooks/useGreeting.js";

const DashBoard = () => {
  const greetings = useGreeting();
  const { user } = useAuth();

  const dashboardData = [
    {
      title: "Cashier",
      count: 99,
      paragraph: "Active Cashier",
      icon: "",
    },
    {
      title: "DDO",
      count: 12,
      paragraph: "Active DDO",
      icon: "📂",
    },
    {
      title: "Department",
      count: 45,
      paragraph: "Active Department",
      icon: "",
    },
    {
      title: "Division",
      count: 1200,
      paragraph: "Active Division",
      icon: "",
    },
  ];

  return (
    <div className="h-screen w-full px-7 flex flex-col gap-7">
      <div className="h-fit w-full mx-auto">
        <span className="text-xl font-normal pb-5 font-unbounded">
          {greetings}, {capitalizeFullName(user.name)}
        </span>
        <p className="text-base text-gray-700 font-medium font-inter">
          Here is an overview of today’s activities.
        </p>
      </div>
      <div className="h-fit w-full flex gap-5">
        <DashboardBox />
        <DashboardBox items={dashboardData} />
        <DashboardBox />
      </div>
    </div>
  );
};

export default DashBoard;
