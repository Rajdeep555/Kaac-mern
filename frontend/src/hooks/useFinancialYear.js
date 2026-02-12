export const getFinancialYears = (startYear = 2023) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const currentFYStart =
        currentMonth < 3 ? currentYear - 1 : currentYear;

    const years = [];

    for (let year = currentFYStart; year >= startYear; year--) {
        years.push(`${year}-${year + 1}`);
    }

    return years;
};
