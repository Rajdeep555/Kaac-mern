import React from "react";
import { useExpenditure } from "../../hooks/admin/useExpenditure";

const Form3 = ({ data: dataProp = [], title, sector }) => {
  // Fetch COUNCIL data
  const {
    expenditures: councilData,
    loading: councilLoading,
    error: councilError,
  } = useExpenditure(
    { sector: "COUNCIL" },
    { enabled: sector === "COUNCIL" || sector === "CONSOLIDATED" },
  );

  // Fetch STATE data
  const {
    expenditures: stateData,
    loading: stateLoading,
    error: stateError,
  } = useExpenditure(
    { sector: "STATE" },
    { enabled: sector === "STATE" || sector === "CONSOLIDATED" },
  );

  // Determine which data to display
  const data = React.useMemo(() => {
    if (sector === "COUNCIL") {
      return councilData ?? [];
    } else if (sector === "STATE") {
      return stateData ?? [];
    } else if (sector === "CONSOLIDATED") {
      // Combine both datasets and sort by date
      return [...(councilData ?? []), ...(stateData ?? [])].sort(
        (a, b) => new Date(a.chequeIssueDate) - new Date(b.chequeIssueDate),
      );
    }
    return dataProp;
  }, [sector, councilData, stateData, dataProp]);

  const loading =
    sector === "COUNCIL"
      ? councilLoading
      : sector === "STATE"
        ? stateLoading
        : sector === "CONSOLIDATED"
          ? councilLoading || stateLoading
          : false;

  const error =
    sector === "COUNCIL"
      ? councilError
      : sector === "STATE"
        ? stateError
        : sector === "CONSOLIDATED"
          ? councilError || stateError
          : null;

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 3 data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-red-600">
          Failed to load data. Please try again.
        </p>
      </div>
    );
  }

  const getTitle = () => {
    if (title) return title;

    switch (sector) {
      case "COUNCIL":
        return "Register of cheque drawn during the month (COUNCIL)";
      case "STATE":
        return "Register of cheque drawn during the month (STATE)";
      case "CONSOLIDATED":
        return "Register of cheque drawn during the month (CONSOLIDATED - Council & State)";
      default:
        return "Register of cheque drawn during the month";
    }
  };

  return (
    <div className="w-full overflow-x-auto border-2 bg-white">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">FORM NO. 3</h1>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        <h2 className="py-4 font-semibold">{getTitle()}</h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-330 border border-black text-[11px] text-center mx-4">
          <thead>
            <tr>
              <th className="border border-black font">Cheque Book No.</th>
              <th className="border border-black font">Cheque No.</th>
              <th className="border border-black font">Date of Issue</th>
              <th className="border border-black font">Amount Rs</th>
              <th className="border border-black font">
                Name of the Treasury <br /> on which drawn
              </th>
              <th className="border border-black font">Voucher No.</th>
              <th className="border border-black font">Treasury Date</th>
              {sector === "CONSOLIDATED" && (
                <th className="border border-black font">Sector</th>
              )}
              <th className="border border-black font">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {(!data || data.length === 0) && (
              <tr>
                <td
                  colSpan={sector === "CONSOLIDATED" ? "9" : "8"}
                  className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {data?.map((item) => (
              <tr key={item.id} className="border font-small">
                <td className="border py-1">{item.chequeBookNo ?? "-"}</td>
                <td className="border py-1">{item.chequeNo ?? "-"}</td>
                <td className="border py-1">
                  {item.chequeIssueDate
                    ? new Date(item.chequeIssueDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="border py-1">
                  ₹{Number(item.grossAmount ?? 0).toFixed(2)}
                </td>
                <td className="border py-1">{item.treasuryName ?? "-"}</td>
                <td className="border py-1">
                  {item.voucherNo ?? item.treasuryVoucherNo ?? "-"}
                </td>
                <td className="border py-1">
                  {item.treasuryDate
                    ? new Date(item.treasuryDate).toLocaleDateString()
                    : "-"}
                </td>
                {sector === "CONSOLIDATED" && (
                  <td className="border py-1">{item.sector ?? "-"}</td>
                )}
                <td className="border py-1">{item.remarks ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="px-4 py-2 tracking-wide font-semibold">
        <p>Secretary</p>
      </div>
    </div>
  );
};

export default Form3;
