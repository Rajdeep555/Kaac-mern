import { useEffect, useMemo, useRef, useState } from "react";
import { IoSearch } from "react-icons/io5";
import { BsArrowRightShort, BsArrowLeftShort } from "react-icons/bs";
import { useDataTable } from "./useDataTable";
import { toCSV, downloadTextFile } from "../../utils/csvUtils";
import { handlePrint } from "../../utils/printUtils";

export const ButtonTwo = ({ name, bgColor, onClick, hoverColor = "" }) => (
  <button
    onClick={onClick}
    type="button"
    className={`${bgColor} ${hoverColor} px-5 py-2 rounded-full text-white text-sm font-unbounded font-light flex items-center justify-center gap-2 cursor-pointer`}>
    {name}
  </button>
);

const DataTable = ({
  data,
  columns,
  searchableKeys = [],
  statusKey,
  pageSize = 15,
  actionSlot,
  downloadFileName = "table",
  printTitle = "Report",
}) => {
  const {
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    totalPages,
    data: rows,
    filteredData,
  } = useDataTable({
    data,
    searchableKeys,
    statusKey,
    pageSize,
  });

  const [openDownload, setOpenDownload] = useState(false);
  const downloadWrapRef = useRef(null);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!downloadWrapRef.current) return;
      if (!downloadWrapRef.current.contains(e.target)) setOpenDownload(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const csvColumns = useMemo(
    () => (columns || []).filter((c) => c?.key),
    [columns]
  );

  const handleDownloadThisPage = () => {
    const csv = toCSV(rows, csvColumns);
    downloadTextFile(csv, `${downloadFileName}_page_${page}.csv`);
    setOpenDownload(false);
  };

  const handleDownloadAll = () => {
    const csv = toCSV(filteredData, csvColumns);
    downloadTextFile(csv, `${downloadFileName}_all.csv`);
    setOpenDownload(false);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between print:hidden">
        {statusKey && (
          <div className="flex rounded-full overflow-hidden bg-gray-200">
            {["all", "active", "inactive"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-4 py-1.5 text-xs lowercase font-unbounded ${
                  status === s
                    ? "bg-gray-500 rounded-full overflow-auto text-white m-1"
                    : ""
                }`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <ButtonTwo
              name="Print"
              bgColor="bg-blue-500"
              hoverColor="hover:bg-blue-700"
              onClick={handlePrint}
            />

            <div className="relative" ref={downloadWrapRef}>
              <ButtonTwo
                name="Download"
                bgColor="bg-green-500"
                hoverColor="hover:bg-green-700"
                onClick={() => setOpenDownload((v) => !v)}
              />

              {openDownload && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-50">
                  <button
                    type="button"
                    onClick={handleDownloadThisPage}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100">
                    Download this page
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100">
                    Download all
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-gray-200 outline-none px-5 text-sm py-2 rounded-full w-64"
            />
            <IoSearch className="absolute text-xl right-3 top-1/2 -translate-y-1/2 text-gray-900" />
          </div>

          {actionSlot}
        </div>
      </div>
      {/* Print-only header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-semibold">{printTitle}</h1>
        <p className="text-sm text-gray-600">
          Generated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Table */}
      <div
        id="printArea"
        className="overflow-x-auto border border-gray-500 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 print:bg-transparent">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-2 border-b border-b-gray-500 font-unbounded font-normal">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  No data found
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50 print:hover:bg-transparent">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-2 border-b print:border-b print:border-black">
                      {col.render
                        ? col.render(row?.[col.key], row)
                        : row?.[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 print:hidden">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-gray-400 rounded disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-300"
            type="button">
            <BsArrowLeftShort className="text-xl" />
            Prev
          </button>

          <span className="px-3 py-1">
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-gray-400 rounded disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-300"
            type="button">
            Next <BsArrowRightShort className="text-xl" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
