import TableButton from "../ui/TableButton";
import { useDataTable } from "./useDataTable";
import { IoSearch } from "react-icons/io5";

const DataTable = ({
  data,
  columns,
  searchableKeys = [],
  statusKey,
  pageSize = 5,
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
  } = useDataTable({
    data,
    searchableKeys,
    statusKey,
    pageSize,
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {statusKey && (
          <div className="flex rounded-full overflow-hidden bg-gray-200">
            {["all", "active", "inactive"].map((s) => (
              <button
                key={s}
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
        <div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-gray-200 outline-none px-5 text-sm py-2 rounded-full w-64 "
            />
            <IoSearch className="absolute text-xl right-3 top-1/2 -translate-y-1/2 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-2 border-b">
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
                <tr key={i} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-2 border-b">
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key]}
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
        <div className="flex justify-end gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50">
            Prev
          </button>

          <span className="px-3 py-1">
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
