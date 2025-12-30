export const csvEscape = (value) => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

export const toCSV = (dataRows = [], columns = []) => {
    const cols = columns.filter((c) => c?.key);
    const headers = cols.map((c) => csvEscape(c.label)).join(",");
    const keys = cols.map((c) => c.key);

    const lines = dataRows.map((row) =>
        keys.map((k) => csvEscape(row?.[k])).join(",")
    );

    return [headers, ...lines].join("\n");
};

export const downloadTextFile = (
    content,
    filename,
    contentType = "text/csv;charset=utf-8;"
) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
};
