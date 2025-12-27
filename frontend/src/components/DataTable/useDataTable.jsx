import { useState, useMemo } from "react";

export const useDataTable = ({
  data = [],
  searchableKeys = [],
  statusKey,
  pageSize = 5,
}) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (search) {
      result = result.filter((row) =>
        searchableKeys.some((key) =>
          String(row[key] ?? "")
            .toLowerCase()
            .includes(search.toLowerCase())
        )
      );
    }

    // Status filter
    if (status !== "all" && statusKey) {
      result = result.filter((row) => row[statusKey] === status);
    }

    return result;
  }, [data, search, status, searchableKeys, statusKey]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return {
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    totalPages,
    data: paginatedData,
  };
};
