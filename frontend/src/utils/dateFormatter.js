export const formatDate = (date) => {
    if (!date) return "-";

    const value = String(date).trim();

    // YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        const [year, month, day] = value.substring(0, 10).split("-");

        return `${day}-${month}-${year}`;
    }

    // DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split("/");

        return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
    }

    // DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) {
        const [day, month, year] = value.split("-");

        return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
    }

    return value;
};