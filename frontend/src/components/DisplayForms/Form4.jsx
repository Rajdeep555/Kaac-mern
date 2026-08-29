import React from "react";
import { useForm4 } from "../../hooks/admin/useForm4";

// classification is now an array of { level, code, name } from the
// backend (see getForm4Data) instead of a "/"-joined string. Render
// each level on its own line: "code - name" when resolved, else just
// the code — matches the vertical mock-up format.
const ClassificationCell = ({ classification }) => {
  if (!classification || classification.length === 0) {
    return <td className="border py-1 align-top">-</td>;
  }

  return (
    <td className="border py-1 text-left px-2 align-top">
      {classification.map((line, idx) => (
        <div key={idx}>
          {line.name ? `${line.code} - ${line.name}` : line.code}
        </div>
      ))}
    </td>
  );
};

const Form4 = ({ sector, dateRange }) => {
  // Single hook — pass sector + date range directly to backend
  // Backend handles COUNCIL, STATE, CONSOLIDATED filtering
  const { form4Data, loading, error } = useForm4({ sector, dateRange });

  const getTitle = () => {
    switch (sector) {
      case "COUNCIL":
        return "Register of Remittances to Treasury (COUNCIL)";
      case "STATE":
        return "Register of Remittances to Treasury (STATE)";
      case "CONSOLIDATED":
        return "Register of Remittances to Treasury (CONSOLIDATED - Council & State)";
      default:
        return "Register of Remittances to Treasury (PLA)";
    }
  };

  // Total of Amount Remitted column
  const totalAmount = (form4Data ?? []).reduce(
    (sum, item) => sum + Number(item?.amount ?? 0),
    0,
  );

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 4 data...</p>
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

  return (
    <div className="w-full overflow-x-auto border-2">
      <div className="flex flex-col items-center py-4">
        <h1 className="font-bold text-lg">FORM NO. 4</h1>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
        <h2 className="py-4 font-semibold">{getTitle()}</h2>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto my-8">
        <table className="min-w-full border mx-4 border-black text-[11px] text-center">
          <thead>
            <tr>
              <th className="border border-black font">Challan No</th>
              <th className="border border-black font">Date</th>
              <th className="border border-black font">Name of Treasury</th>
              <th className="border border-black font">Amount Remitted</th>
              <th className="border border-black font">
                Reference to Cash
                <br />
                Book item No
              </th>
              <th className="border border-black font">Classification</th>
              {/* Extra Sector column only for CONSOLIDATED */}
              {sector === "CONSOLIDATED" && (
                <th className="border border-black font">Sector</th>
              )}
              <th className="border border-black font">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {/* No data message */}
            {(!form4Data || form4Data.length === 0) && (
              <tr>
                <td
                  colSpan={sector === "CONSOLIDATED" ? 8 : 7}
                  className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {form4Data?.map((item) => {
              const {
                id,
                clnNo,
                date,
                treasury,
                amount,
                refItemNo,
                classification,
                remarks,
                sector: itemSector,
              } = item;

              return (
                <tr key={id} className="border font-small">
                  <td className="border py-1 align-top">{clnNo ?? "-"}</td>
                  <td className="border py-1 align-top">
                    {date ? new Date(date).toLocaleDateString() : "-"}
                  </td>
                  <td className="border py-1 align-top">{treasury ?? "-"}</td>
                  <td className="border py-1 align-top">
                    ₹{Number(amount ?? 0).toFixed(2)}
                  </td>
                  <td className="border py-1 align-top">{refItemNo ?? "-"}</td>
                  <ClassificationCell classification={classification} />
                  {/* Sector cell only for CONSOLIDATED */}
                  {sector === "CONSOLIDATED" && (
                    <td className="border py-1 align-top">
                      {itemSector ?? "-"}
                    </td>
                  )}
                  <td className="border py-1 align-top">{remarks ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>

          {/* Total row for Amount Remitted */}
          {form4Data && form4Data.length > 0 && (
            <tfoot>
              <tr className="border font-bold">
                <td className="border py-1" colSpan={3}>
                  Total
                </td>
                <td className="border py-1">₹{totalAmount.toFixed(2)}</td>
                <td
                  className="border py-1"
                  colSpan={sector === "CONSOLIDATED" ? 3 : 2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <hr className="w-full mb-4 h-0.5 bg-black" />

      <div className="font-semibold px-4 py-2 text-end">
        <p>Signature of the Officer</p>
      </div>
    </div>
  );
};

export default Form4;
