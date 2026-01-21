export const formatIndianNumber = (value) => {
    if(value === null || value === undefined || value === "") return "";
    
    
    const number = Number(value.toString().replace(/,/g, ""));

    if(isNaN(number)) return "";

    return new Intl.NumberFormat("en-IN").format(number);
}