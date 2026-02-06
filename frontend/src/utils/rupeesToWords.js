const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
    "", "", "Twenty", "Thirty", "Forty",
    "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

const convertBelowThousand = (num) => {
    let str = "";

    if (num >= 100) {
        str += ones[Math.floor(num / 100)] + " Hundred ";
        num %= 100;
    }

    if (num >= 20) {
        str += tens[Math.floor(num / 10)] + " ";
        num %= 10;
    }

    if (num > 0) {
        str += ones[num] + " ";
    }

    return str.trim();
};

export const rupeesToWords = (amount) => {
    if (!amount || isNaN(amount)) return "";

    let num = parseInt(amount, 10);
    if (num === 0) return "Zero Rupees Only";

    let result = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    if (crore) result += convertBelowThousand(crore) + " Crore ";
    if (lakh) result += convertBelowThousand(lakh) + " Lakh ";
    if (thousand) result += convertBelowThousand(thousand) + " Thousand ";
    if (num) result += convertBelowThousand(num);

    return result.trim() + " Rupees Only";
};
