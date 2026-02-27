import React, { useState } from "react";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import FormOne from "../../components/Forms/FormOne";
import { useDivisions } from "../../hooks/useDivisions.js";
import { createDivision } from "../../api/division.api";

const State_Recipt_Report = () => {
  // const { divisions, loading } = useDivisions();
  const [divisions, loading] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    { key: "id", label: "Sl No" },
    { key: "headofAccount", label: "Head of Account" },
    { key: "receipt", label: "Receipt (Lakhs)" },
    { key: "receiptDate", label: "Receipt Date" },
    { key: "disbursement", label: "Disbursement (₹)" },
    { key: "disbursementDate", label: "Disbursement Date" },
    { key: "balance", label: "Balance (₹ & Lakhs)" },
  ];

  return (
    <>
      <div className={`${isModalOpen ? "hidden" : "block"} p-6 space-y-6`}>
        <h1 className="font-unbounded text-3xl font-normal">
          State Receipt Reports
        </h1>

        <DataTable
          data={Array.isArray(divisions) ? divisions : []}
          columns={columns}
          loading={loading}
          searchableKeys={["divisionName", "divisionCode"]}
          pageSize={10}
        />
      </div>
    </>
  );
};

export default State_Recipt_Report;
