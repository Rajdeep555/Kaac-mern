import React from "react";
import { VscFile } from "react-icons/vsc";
import { VscArrowRight } from "react-icons/vsc";
import { Outlet, useNavigate } from "react-router-dom";

const GenerateReports = () => {
  const navigate = useNavigate();

  return (
    <div className="p-5 w-full h-screen">
      <div className="w-full h-1/4 bg-gray-100 p-5 rounded shadow-md hover:shadow-lg">
        <h1 className="text-xl font-medium font-unbounded mb-5">
          Generate Reports
        </h1>
        <div className="flex gap-5">
          <div
            onClick={() => navigate("/track-forms/council")}
            className="w-3xs bg-gray-300 px-4 py-4 cursor-pointer active:scale-95 rounded flex items-center gap-5">
            <VscFile />
            Council Report
            <VscArrowRight className="ml-13" />
          </div>

          <div
            onClick={() => navigate("/track-statements")}
            className="w-3xs bg-gray-300 px-4 py-4 cursor-pointer active:scale-95 rounded flex items-center gap-5">
            <VscFile />
            Council Statements
            <VscArrowRight className="ml-5 " />
          </div>

          <div
            onClick={() => navigate("/track-forms/state")}
            className="w-3xs bg-gray-300 px-4 py-4 cursor-pointer active:scale-95 rounded flex items-center gap-5">
            <VscFile />
            State Report
            <VscArrowRight className="ml-13" />
          </div>

          <div
            onClick={() => navigate("/track-forms/consolidated")}
            className="w-3xs bg-gray-300 px-4 py-4 cursor-pointer active:scale-95 rounded flex items-center gap-5">
            <VscFile />
            Consolidated Report
            <VscArrowRight className="ml-13" />
          </div>

          <div
            onClick={() => navigate("/track-statements")}
            className="w-3xs bg-gray-300 px-4 py-4 cursor-pointer active:scale-95 rounded flex items-center gap-5">
            <VscFile />
            State Statements
            <VscArrowRight className="ml-5 " />
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
};

export default GenerateReports;
