import React, { useEffect, useState } from "react";
import { getChequeDetailsApi } from "../../api/expenditure.api";
import DataTable from "../../components/DataTable/DataTable";
import TableButton from "../../components/ui/TableButton";
import { useNavigate } from "react-router-dom";
import { BsPrinter } from "react-icons/bs";
import { LuDownload } from "react-icons/lu";
import { getFinancialYears } from "../../hooks/useFinancialYear";

// ── Static options ────────────────────────────────────────────────────────────
const SECTOR_OPTIONS = [
  { label: "All Sectors", value: "" },
  { label: "01-COUNCIL", value: "COUNCIL" },
  { label: "02-STATE", value: "STATE" },
];

// Indian FY months: April(4) → March(3)
const FY_MONTH_OPTIONS = [
  { label: "All Months", value: "" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
];

const FY_OPTIONS = [
  { label: "All Years", value: "" },
  ...getFinancialYears(2023).map((fy) => ({ label: fy, value: fy })),
];

// ── Formatters ────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatAmount = (amt) =>
  Number(amt).toLocaleString("en-IN", { minimumFractionDigits: 2 });

// ── CSV helper ────────────────────────────────────────────────────────────────
const downloadCSV = (rows, total) => {
  const headers = [
    "Month",
    "Cheque Book No",
    "Cheque No",
    "Date",
    "Total Amount (Rs)",
  ];
  const lines = rows.map((r) => [
    formatMonth(r.chequeIssueDate),
    r.chequeBookNo,
    r.chequeNo,
    formatDate(r.chequeIssueDate),
    Number(r.totalAmount).toFixed(2),
  ]);
  lines.push(["", "", "", "GRAND TOTAL", Number(total).toFixed(2)]);

  const csv = [headers, ...lines]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cheque_details.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ── Filter select ─────────────────────────────────────────────────────────────
const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
                 outline-none focus:ring-2 focus:ring-black/20 min-w-[160px]">
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const ChequeDetails = () => {
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [sector, setSector] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [month, setMonth] = useState("");

  // Reset month when FY changes
  const handleFYChange = (val) => {
    setFinancialYear(val);
    setMonth("");
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getChequeDetailsApi({
          sector: sector || undefined,
          financialYear: financialYear || undefined,
          month: month || undefined,
        });
        setData(res.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load cheque details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sector, financialYear, month]);

  const grandTotal = data.reduce((sum, r) => sum + Number(r.totalAmount), 0);

  const columns = [
    {
      key: "chequeIssueDate",
      label: "Month",
      render: (val) => formatMonth(val),
    },
    {
      key: "chequeBookNo",
      label: "Cheque Book No",
      render: (val) => val || "-",
    },
    {
      key: "chequeNo",
      label: "Cheque No",
    },
    {
      key: "chequeIssueDate_date",
      label: "Cheque Issue Date",
      render: (_, row) => formatDate(row.chequeIssueDate),
    },
    {
      key: "totalAmount",
      label: "Total Amount (₹)",
      render: (val) => (
        <span className="font-medium tabular-nums">₹ {formatAmount(val)}</span>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-title { display: block !important; }
        }
        .print-title { display: none; }
      `}</style>

      <div className="p-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-zinc-400 pb-3">
          <div>
            <h1 className="font-unbounded text-2xl font-normal">
              Cheque Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Grouped totals by cheque number
            </p>
          </div>
          <div className="no-print">
            <TableButton
              name="Back"
              onClick={() => navigate("/generated-expenditure")}
            />
          </div>
        </div>

        {/* ── Print-only title ── */}
        <div className="print-title mb-2">
          <h2 className="text-xl font-semibold">Cheque Details Report</h2>
          {financialYear && (
            <p className="text-sm text-gray-600">
              Financial Year: {financialYear}
              {month
                ? ` | Month: ${FY_MONTH_OPTIONS.find((m) => m.value === month)?.label}`
                : ""}
              {sector ? ` | Sector: ${sector}` : ""}
            </p>
          )}
          <p className="text-sm text-gray-600">
            Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* ── Filters + action buttons ── */}
        <div className="no-print flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <FilterSelect
              label="Sector"
              value={sector}
              onChange={setSector}
              options={SECTOR_OPTIONS}
            />
            <FilterSelect
              label="Financial Year"
              value={financialYear}
              onChange={handleFYChange}
              options={FY_OPTIONS}
            />
            <FilterSelect
              label="Month"
              value={month}
              onChange={setMonth}
              options={FY_MONTH_OPTIONS}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500
                         hover:bg-blue-600 text-white text-sm font-unbounded font-light">
              <BsPrinter className="text-base" /> Print
            </button>
            <button
              type="button"
              onClick={() => downloadCSV(data, grandTotal)}
              disabled={data.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500
                         hover:bg-green-600 disabled:opacity-50 text-white text-sm
                         font-unbounded font-light">
              <LuDownload className="text-base" /> Download CSV
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <p
            className="text-red-500 text-sm bg-red-50 border border-red-200
                        rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        {/* ── Table ── */}
        <DataTable
          data={data}
          columns={columns}
          loading={loading}
          searchableKeys={["chequeNo", "chequeBookNo"]}
          pageSize={100}
          emptyMessage={loading ? "Loading..." : "No cheque data found"}
          downloadFileName="cheque_details"
          printTitle="Cheque Details Report"
        />

        {/* ── Grand total ── */}
        {!loading && data.length > 0 && (
          <div className="flex justify-end">
            <div
              className="border border-gray-300 rounded-xl px-6 py-3 bg-gray-50
                            flex items-center gap-8">
              <span className="text-sm font-unbounded font-light text-gray-600">
                Grand Total&nbsp;
                <span className="text-gray-400">
                  ({data.length} cheque{data.length !== 1 ? "s" : ""})
                </span>
              </span>
              <span className="text-lg font-semibold tabular-nums">
                ₹ {formatAmount(grandTotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChequeDetails;
