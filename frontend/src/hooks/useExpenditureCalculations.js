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

    const cpf = useWatch({
        control,
        name: ["cpfCouncil", "cpfContribution", "cpfRecovery"],
    });

    useEffect(() => {
        const total = amounts.reduce((s, v) => s + Number(v || 0), 0);
        setValue("grossAmount", total, { shouldDirty: false });
    }, [amounts, setValue]);

    useEffect(() => {
        const total = deductions.reduce((s, v) => s + Number(v || 0), 0);
        setValue("grossDeduction", total, { shouldDirty: false });
    }, [deductions, setValue]);

    useEffect(() => {
        const total = cpf.reduce((s, v) => s + Number(v || 0), 0);
        setValue("cpfPayable", total, { shouldDirty: false });
    }, [cpf, setValue]);

    useEffect(() => {
        setValue(
            "netDeduction",
            Number(control._formValues.grossDeduction || 0) -
            Number(control._formValues.cpfPayable || 0),
            { shouldDirty: false }
        );
    }, [control._formValues.grossDeduction, control._formValues.cpfPayable]);

    useEffect(() => {
        const net =
            Number(control._formValues.grossAmount || 0) -
            Number(control._formValues.netDeduction || 0);

        setValue("netAmount", net, { shouldDirty: false });
        setValue("amountPayable", net, { shouldDirty: false });
    }, [
        control._formValues.grossAmount,
        control._formValues.netDeduction,
    ]);
};
