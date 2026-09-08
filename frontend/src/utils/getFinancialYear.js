const getFinancialYear = (from, to) => {
    if (!from && !to) return "";

    const date = new Date(from || to);

    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // April to March financial year
    const startYear = month >= 4 ? year : year - 1;

    return `${startYear}-${String(startYear + 1).slice(-2)}`;
};

export default getFinancialYear;