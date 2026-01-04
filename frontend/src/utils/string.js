// capitalize first letter  - eg. Rajdeep Boruah
export const capitalizeFullName = (str = "") => {
    if (!str) return "";
    return str
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};
