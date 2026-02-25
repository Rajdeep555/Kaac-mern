import React from "react";
import { useForm4 } from "../../hooks/admin/useForm4";

const Form4 = ({ sector }) => {
  // Single hook — pass sector directly to backend
  // Backend handles COUNCIL, STATE, CONSOLIDATED filtering
  const { form4Data, loading, error } = useForm4({ sector });

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
                  <td className="border py-1">{clnNo ?? "-"}</td>
                  <td className="border py-1">
                    {date ? new Date(date).toLocaleDateString() : "-"}
                  </td>
                  <td className="border py-1">{treasury ?? "-"}</td>
                  <td className="border py-1">
                    ₹{Number(amount ?? 0).toFixed(2)}
                  </td>
                  <td className="border py-1">{refItemNo ?? "-"}</td>
                  <td className="border py-1">{classification ?? "-"}</td>
                  {/* Sector cell only for CONSOLIDATED */}
                  {sector === "CONSOLIDATED" && (
                    <td className="border py-1">{itemSector ?? "-"}</td>
                  )}
                  <td className="border py-1">{remarks ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
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
