// components/Expenditure/DeductionsSection.jsx
import InputField from "../Forms/InputField";

const DeductionsSection = ({ register }) => {
  return (
    <>
      <InputField label="CGST" name="cgst" register={register} />
      <InputField label="SGST" name="sgst" register={register} />
      <InputField label="IGST" name="igst" register={register} />
      <InputField
        label="Earnest Money (Deduction)"
        name="earnestMoneyDeduction"
        register={register}
      />
      <InputField label="PTAX" name="ptax" register={register} />
      <InputField label="ITAX" name="itax" register={register} />
      <InputField
        label="Car Loan Recovery"
        name="carLoanRecovery"
        register={register}
      />
      <InputField
        label="House Building Loan Recovery"
        name="houseLoanRecovery"
        register={register}
      />
      <InputField
        label="CPF Council Share"
        name="cpfCouncil"
        register={register}
      />
      <InputField
        label="CPF Contribution"
        name="cpfContribution"
        register={register}
      />
      <InputField label="CPF Recovery" name="cpfRecovery" register={register} />
      <InputField label="House Rent" name="houseRent" register={register} />
      <InputField
        label="Security Deposits"
        name="securityDepositsDeduction"
        register={register}
      />
      <InputField
        label="Forest Royalty"
        name="forestRoyalty"
        register={register}
      />
      <InputField label="Monopoly" name="monopoly" register={register} />
      <InputField
        label="M/C On Forest Royalty"
        name="mcForestRoyalty"
        register={register}
      />
      <InputField label="MDRRF" name="mdrrf" register={register} />
      <InputField label="DMFT" name="dmft" register={register} />
      <InputField label="Labour Cess" name="labourCess" register={register} />
      <InputField
        label="IT On Forest Royalty"
        name="itForestRoyalty"
        register={register}
      />
      <InputField label="VAT" name="vat" register={register} />
      <InputField
        label="Advance Payment Recovery"
        name="advanceRecovery"
        register={register}
      />
      <InputField
        label="Other Deductions"
        name="otherDeductions"
        register={register}
      />
      <InputField
        label="Gross Total Deduction"
        name="grossDeduction"
        register={register}
        readonly
      />
      <InputField
        label="CPF Payable"
        name="cpfPayable"
        register={register}
        readonly
      />
      <InputField
        label="Net Deduction"
        name="netDeduction"
        register={register}
        readonly
      />
      <InputField
        label="Net Amount"
        name="netAmount"
        register={register}
        readonly
      />
      <InputField
        label="Amount Payable"
        name="amountPayable"
        register={register}
        readonly
      />
      <InputField
        label="Amount In Words"
        name="amountInWords"
        register={register}
        readonly
      />
    </>
  );
};

export default DeductionsSection;
