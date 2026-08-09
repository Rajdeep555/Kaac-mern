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

  // Format date as DD-MM-YYYY
  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return "-";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // Calculate total gross amount
  const totalGrossAmount = React.useMemo(() => {
    return (data ?? []).reduce(
      (total, item) => total + Number(item.grossAmount ?? 0),
      0,
    );
  }, [data]);

  if (loading) {
    return <div>Loading Form 3 data...</div>;
  }

  if (error) {
    return <div>Failed to load data. Please try again.</div>;
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
    <div>
      <h2 className="text-center font-bold">FORM NO. 3</h2>

      {sector && <div className="text-center">Sector: {sector}</div>}

      <h3 className="text-center font-semibold">{getTitle()}</h3>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-[1320px] border border-black text-[11px] text-center mx-4">
          <thead>
            <tr>
              <th className="border border-black font">Cheque Book No.</th>
              <th className="border border-black font">Cheque No.</th>
              <th className="border border-black font">Date of Issue</th>
              <th className="border border-black font">Amount Rs</th>
              <th className="border border-black font">
                Name of the Treasury <br />
                on which drawn
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
                  colSpan={sector === "CONSOLIDATED" ? 9 : 8}
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
                  {formatDate(item.chequeIssueDate)}
                </td>

                <td className="border py-1">
                  ₹{Number(item.grossAmount ?? 0).toFixed(2)}
                </td>

                <td className="border py-1">{item.treasuryName ?? "-"}</td>

                <td className="border py-1">
                  {item.voucherNo ?? item.treasuryVoucherNo ?? "-"}
                </td>

                <td className="border py-1">{formatDate(item.treasuryDate)}</td>

                {sector === "CONSOLIDATED" && (
                  <td className="border py-1">{item.sector ?? "-"}</td>
                )}

                <td className="border py-1">{item.remarks ?? "-"}</td>
              </tr>
            ))}

            {/* Total Row */}
            {data && data.length > 0 && (
              <tr className="border border-black font-bold">
                <td
                  colSpan={sector === "CONSOLIDATED" ? 3 : 3}
                  className="border border-black py-2 text-right pr-2">
                  TOTAL
                </td>

                <td className="border border-black py-2">
                  ₹{totalGrossAmount.toFixed(2)}
                </td>

                <td
                  colSpan={sector === "CONSOLIDATED" ? 5 : 4}
                  className="border border-black"></td>
              </tr>
            )}
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
