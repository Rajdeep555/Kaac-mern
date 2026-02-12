// hooks/useExpenditureCalculations.js
import { useEffect } from "react";
import { useWatch } from "react-hook-form";

export const useExpenditureCalculations = ({ control, setValue }) => {
    const amounts = useWatch({
        control,
        name: [
            "payOfficers",
            "payEstablishment",
            "allowanceHonorary",
            "contingencies",
            "grantsInAid",
            "works",
            "loansAdvances",
            "loanRepayGovt",
            "loanRepayOther",
            "securityDeposit",
            "earnestMoney",
            "transferPayment",
        ],
    });

    const deductions = useWatch({
        control,
        name: [
            "cgst",
            "sgst",
            "igst",
            "earnestMoneyDeduction",
            "ptax",
            "itax",
            "carLoanRecovery",
            "houseLoanRecovery",
            "cpfCouncil",
            "cpfContribution",
            "cpfRecovery",
            "houseRent",
            "securityDepositsDeduction",
            "forestRoyalty",
            "monopoly",
            "mcForestRoyalty",
            "mdrrf",
            "dmft",
            "labourCess",
            "itForestRoyalty",
            "vat",
            "advanceRecovery",
            "otherDeductions",
        ],
    });

    const [cpfCouncil, cpfContribution, cpfRecovery] = useWatch({
        control,
        name: ["cpfCouncil", "cpfContribution", "cpfRecovery"],
    });

    const [grossAmount, grossDeduction] = useWatch({
        control,
        name: ["grossAmount", "grossDeduction"],
    });

    /* ================= GROSS AMOUNT ================= */
    useEffect(() => {
        const total = amounts.reduce(
            (sum, v) => sum + Number(v || 0),
            0
        );

        setValue("grossAmount", total, { shouldDirty: false });
    }, [amounts, setValue]);

    /* ================= GROSS DEDUCTION ================= */
    useEffect(() => {
        const total = deductions.reduce(
            (sum, v) => sum + Number(v || 0),
            0
        );

        setValue("grossDeduction", total, { shouldDirty: false });
    }, [deductions, setValue]);

    /* ================= CPF PAYABLE ================= */
    useEffect(() => {
        const total =
            Number(cpfCouncil || 0) +
            Number(cpfContribution || 0) +
            Number(cpfRecovery || 0);

        setValue("cpfPayable", total, { shouldDirty: false });
    }, [cpfCouncil, cpfContribution, cpfRecovery, setValue]);

    /* ================= NET DEDUCTION ================= */
    useEffect(() => {
        const net = Number(grossDeduction || 0) - Number(cpfCouncil || 0);

        setValue("netDeduction", net, { shouldDirty: false });
    }, [grossDeduction, cpfCouncil, setValue]);

    /* ================= NET AMOUNT ================= */
    useEffect(() => {
        const net = Number(grossAmount || 0) - Number(grossDeduction || 0);

        setValue("netAmount", net, { shouldDirty: false });
        setValue("amountPayable", net, { shouldDirty: false });
    }, [grossAmount, grossDeduction, setValue]);
};
