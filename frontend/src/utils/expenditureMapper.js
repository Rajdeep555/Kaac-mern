// src/utils/expenditureMapper.js

/* ===============================
   BACKEND → FORM (EDIT MODE)
================================ */
export const mapBackendToForm = (data) => {
    const toDate = (val) => (val ? val.slice(0, 10) : "");

    return {
        sector: data.sector,
        department: data.departmentId?.toString() || "",
        ddo: data.ddoId?.toString() || "",

        majorHead: data.majorHead || "",
        subMajorHead: data.subMajorHead || "",
        minorHead: data.minorHead || "",
        subHead: data.subHead || "",
        subSubHead: data.subSubHead || "",
        detailHead: data.detailHead || "",
        subDetailHead: data.subDetailHead || "",

        voucherNo: data.voucherNo || "",
        voucherDate: toDate(data.voucherDate),
        requisitionNo: data.requisitionNo || "",
        requisitionDate: toDate(data.requisitionDate),
        grantNo: data.grantNo || "",
        workName: data.workName || "",
        expenditureType: data.expenditureType || "",

        salaryType: data.salaryType || "SALARY",
        planType: data.planType || "",
        financialYear: data.financialYear || "",
        objectHead: data.objectHead || "",

        payOfficers: data.payOfficers ?? "",
        payEstablishment: data.payEstablishment ?? "",
        allowanceHonorary: data.allowanceHonorary ?? "",
        contingencies: data.contingencies ?? "",
        grantsInAid: data.grantsInAid ?? "",
        works: data.works ?? "",
        loansAdvances: data.loansAdvances ?? "",
        loanType: data.loanType ?? "",
        loanRepayGovt: data.loanRepayGovt ?? "",
        loanRepayOther: data.loanRepayOther ?? "",
        securityDeposit: data.securityDeposit ?? "",
        earnestMoney: data.earnestMoney ?? "",
        transferPayment: data.transferPayment ?? "",

        grossAmount: data.grossAmount ?? "",

        cgst: data.cgst ?? "",
        sgst: data.sgst ?? "",
        igst: data.igst ?? "",
        earnestMoneyDeduction: data.earnestMoneyDeduction ?? "",
        ptax: data.ptax ?? "",
        itax: data.itax ?? "",
        carLoanRecovery: data.carLoanRecovery ?? "",
        houseLoanRecovery: data.houseLoanRecovery ?? "",
        cpfCouncil: data.cpfCouncil ?? "",
        cpfContribution: data.cpfContribution ?? "",
        cpfRecovery: data.cpfRecovery ?? "",
        houseRent: data.houseRent ?? "",
        securityDepositsDeduction: data.securityDepositsDeduction ?? "",
        forestRoyalty: data.forestRoyalty ?? "",
        monopoly: data.monopoly ?? "",
        mcForestRoyalty: data.mcForestRoyalty ?? "",
        mdrrf: data.mdrrf ?? "",
        dmft: data.dmft ?? "",
        labourCess: data.labourCess ?? "",
        itForestRoyalty: data.itForestRoyalty ?? "",
        vat: data.vat ?? "",
        advanceRecovery: data.advanceRecovery ?? "",
        otherDeductions: data.otherDeductions ?? "",

        grossDeduction: data.grossDeduction ?? "",
        cpfPayable: data.cpfPayable ?? "",
        netDeduction: data.netDeduction ?? "",
        netAmount: data.netAmount ?? "",
        amountPayable: data.amountPayable ?? "",
        amountInWords: data.amountInWords ?? "",

        remarks: data.remarks ?? "",

        chequeBookNo: data.chequeBookNo ?? "",
        chequeNo: data.chequeNo ?? "",
        chequeIssueDate: toDate(data.chequeIssueDate),
        treasuryName: data.treasuryName ?? "",
        treasuryVoucherNo: data.treasuryVoucherNo ?? "",
        treasuryDate: toDate(data.treasuryDate),
    };
};

/* ===============================
   FORM → BACKEND (CREATE / UPDATE)
================================ */
export const transformDataForBackend = (data) => {
    const toNumber = (v) =>
        v === "" || v === null || v === undefined ? null : Number(v);

    const toISO = (d) => (d ? new Date(d).toISOString() : null);

    return {
        sector: data.sector,
        voucherNo: data.voucherNo,
        voucherDate: toISO(data.voucherDate),
        requisitionNo: data.requisitionNo || null,
        requisitionDate: toISO(data.requisitionDate),
        grantNo: data.grantNo || null,

        departmentId: data.department ? Number(data.department) : null,
        ddoId: data.ddo ? Number(data.ddo) : null,

        workName: data.workName || null,
        expenditureType: data.expenditureType,

        majorHead: data.majorHead,
        subMajorHead: data.subMajorHead || null,
        minorHead: data.minorHead || null,
        subHead: data.subHead || null,
        subSubHead: data.subSubHead || null,
        detailHead: data.detailHead || null,
        subDetailHead: data.subDetailHead || null,

        salaryType: data.salaryType,
        planType: data.planType,
        financialYear: data.financialYear,
        objectHead: data.objectHead || null,

        payOfficers: toNumber(data.payOfficers),
        payEstablishment: toNumber(data.payEstablishment),
        allowanceHonorary: toNumber(data.allowanceHonorary),
        contingencies: toNumber(data.contingencies),
        grantsInAid: toNumber(data.grantsInAid),
        works: toNumber(data.works),
        loansAdvances: toNumber(data.loansAdvances),
        loanType: data.loanType || null,
        loanRepayGovt: toNumber(data.loanRepayGovt),
        loanRepayOther: toNumber(data.loanRepayOther),
        securityDeposit: toNumber(data.securityDeposit),
        earnestMoney: toNumber(data.earnestMoney),
        transferPayment: toNumber(data.transferPayment),

        grossAmount: toNumber(data.grossAmount) || 0,

        cgst: toNumber(data.cgst),
        sgst: toNumber(data.sgst),
        igst: toNumber(data.igst),
        earnestMoneyDeduction: toNumber(data.earnestMoneyDeduction),
        ptax: toNumber(data.ptax),
        itax: toNumber(data.itax),
        carLoanRecovery: toNumber(data.carLoanRecovery),
        houseLoanRecovery: toNumber(data.houseLoanRecovery),
        cpfCouncil: toNumber(data.cpfCouncil),
        cpfContribution: toNumber(data.cpfContribution),
        cpfRecovery: toNumber(data.cpfRecovery),
        houseRent: toNumber(data.houseRent),
        securityDepositsDeduction: toNumber(data.securityDepositsDeduction),
        forestRoyalty: toNumber(data.forestRoyalty),
        monopoly: toNumber(data.monopoly),
        mcForestRoyalty: toNumber(data.mcForestRoyalty),
        mdrrf: toNumber(data.mdrrf),
        dmft: toNumber(data.dmft),
        labourCess: toNumber(data.labourCess),
        itForestRoyalty: toNumber(data.itForestRoyalty),
        vat: toNumber(data.vat),
        advanceRecovery: toNumber(data.advanceRecovery),
        otherDeductions: toNumber(data.otherDeductions),

        grossDeduction: toNumber(data.grossDeduction) || 0,
        cpfPayable: toNumber(data.cpfPayable) || 0,
        netDeduction: toNumber(data.netDeduction) || 0,
        netAmount: toNumber(data.netAmount) || 0,
        amountPayable: toNumber(data.amountPayable) || 0,
        amountInWords: data.amountInWords || "",

        remarks: data.remarks?.trim() || null,

        chequeBookNo: data.chequeBookNo || null,
        chequeNo: data.chequeNo || null,
        chequeIssueDate: toISO(data.chequeIssueDate),
        treasuryName: data.treasuryName || null,
        treasuryVoucherNo: data.treasuryVoucherNo || null,
        treasuryDate: toISO(data.treasuryDate),
    };
};
