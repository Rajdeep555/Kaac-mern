import React from "react";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { useForm7 } from "../../hooks/admin/useForm7";

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const AmountCell = ({ value }) =>
  value > 0 ? (
    <span className="flex items-center justify-center gap-1">
      <LiaRupeeSignSolid />
      {Number(value).toFixed(2)}
    </span>
  ) : (
    "-"
  );

const HeadCodeCell = ({ classification, headCode }) => {
  if (!classification || classification.length === 0) {
    return <div className="font-semibold">{headCode}</div>;
  }
  return classification.map((line, idx) => (
    <div key={idx} className="font-semibold">
      {line.name ? `${line.code} - ${line.name}` : line.code}
    </div>
  ));
};

const Form7 = ({ sector }) => {
  const { form7Data, loading, error } = useForm7({ sector });
  const year = new Date().getFullYear();

  if (loading) {
    return (
      <div className="w-full overflow-x-auto border-2 bg-white p-8 text-center">
        <p className="font-medium text-gray-600">Loading Form 7 data...</p>
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

  const {
    groups = [],
    grandTotalMonths = {},
    grandTotal = 0,
  } = form7Data ?? {};

  return (
    <div className="w-full overflow-x-auto bg-white border-2">
      <div className="flex flex-col px-2 items-center gap-1">
        <h1 className="text-center py-2 text-xl font-bold">Form No. 7</h1>
        <p className="text-sm font-semibold mb-6">
          Month-wise Register of Receipts - Year {year}
        </p>
        {sector && (
          <p className="text-sm font-medium text-gray-600">Sector: {sector}</p>
        )}
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div className="w-full overflow-x-auto">
        <table className="w-full border border-black mx-4 text-[11px] px-2 my-2 text-center">
          <thead>
            <tr className="border">
              <th className="border py-2 px-4 text-left">HEAD CODE</th>
              {MONTHS.map((month) => (
                <th key={month} className="border py-2">
                  {month}
                </th>
              ))}
              <th className="border py-2 px-2">TOTAL</th>
            </tr>
            <tr>
              <th className="border py-2"></th>
              {MONTHS.map((month) => (
                <th key={month} className="border py-2">
                  {year}
                </th>
              ))}
              <th className="border py-2"></th>
            </tr>
          </thead>

          <tbody>
            {(!groups || groups.length === 0) && (
              <tr>
                <td colSpan={15} className="border py-4 font-semibold">
                  No records found
                </td>
              </tr>
            )}

            {groups.map((group, groupIndex) => (
              <React.Fragment key={`group-${groupIndex}-${group.majorHead}`}>
                {group.rows.map((row, rowIndex) => (
                  <tr
                    key={`${groupIndex}-${rowIndex}-${row.headCode}`}
                    className="border">
                    <td className="border py-2 px-4 text-left align-top">
                      <HeadCodeCell
                        classification={row.classification}
                        headCode={row.headCode}
                      />
                    </td>

                    {MONTHS.map((month) => (
                      <td key={month} className="border py-2 align-top">
                        <AmountCell value={row.months[month]} />
                      </td>
                    ))}

                    <td className="border py-2 font-semibold align-top">
                      <AmountCell value={row.total} />
                    </td>
                  </tr>
                ))}

                {group.hasMultiple && (
                  <tr className="bg-gray-100 font-bold border">
                    <td className="border px-4 py-2 text-left">
                      Total — {group.majorHead}
                    </td>
                    {MONTHS.map((month) => (
                      <td key={month} className="border py-2">
                        <AmountCell value={group.majorHeadMonthTotals[month]} />
                      </td>
                    ))}
                    <td className="border py-2">
                      <AmountCell value={group.majorHeadTotal} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {groups.length > 0 && (
              <tr className="bg-gray-200 font-bold border">
                <td className="border px-4 py-2 text-left">GRAND TOTAL</td>
                {MONTHS.map((month) => (
                  <td key={month} className="border py-2">
                    <AmountCell value={grandTotalMonths[month]} />
                  </td>
                ))}
                <td className="border py-2">
                  <AmountCell value={grandTotal} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr className="w-full my-4 h-0.5 bg-black" />

      <div>
        <p className="text-end text-sm mb-4 px-2">Secretary</p>
      </div>
    </div>
  );
};

export default Form7;
