import { useMemo, useState } from "react";

export function useDataTable({
  data = [],
  searchableKeys = [],
  statusKey,
  pageSize = 50,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const filteredData = useMemo(() => {
    let result = Array.isArray(data) ? [...data] : [];

    if (statusKey && status !== "all") {
      const wantActive = status === "active";
      result = result.filter((row) => {
        // Handlingg nested objects and direct boolean
        const statusValue = row?.[statusKey];
        const isActiveValue = Boolean(statusValue);
        return isActiveValue === wantActive;
      });
    }

    // 2. SEARCH FILTER
    if (search.trim() && searchableKeys.length > 0) {
      const s = search.toLowerCase();
      result = result.filter((row) =>
        searchableKeys.some((key) =>
          String(row?.[key] ?? "")
            .toLowerCase()
            .includes(s),
        ),
      );
    }

    return result;
  }, [data, search, searchableKeys, status, statusKey]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return {
    search,
    setSearch,
    status,
    setStatus,
    page: currentPage,
    setPage,
    totalPages,
    data: pageData,
    filteredData,
    loading,
    setLoading,
  };
}
