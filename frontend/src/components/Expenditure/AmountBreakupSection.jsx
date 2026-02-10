// components/Expenditure/AmountBreakupSection.jsx
import InputField from "../Forms/InputField";
import SelectField from "../Forms/SelectField";

const AmountBreakupSection = ({ register, loansAdvances }) => {
  return (
    <>
      <InputField
        label="Pay Of Officers"
        name="payOfficers"
        register={register}
      />
      <InputField
        label="Pay Of Establishment"
        name="payEstablishment"
        register={register}
      />
      <InputField
        label="Allowance And Honorary"
        name="allowanceHonorary"
        register={register}
      />
      <InputField
        label="Contingencies"
        name="contingencies"
        register={register}
      />
      <InputField
        label="Grants-In-Aid"
        name="grantsInAid"
        register={register}
      />
      <InputField label="Works" name="works" register={register} />
      <InputField
        label="Loans & Advances"
        name="loansAdvances"
        register={register}
      />

      <SelectField
        label="Loan Type"
        name="loanType"
        register={register}
        disabled={!Number(loansAdvances) || Number(loansAdvances) <= 0}
        options={[
          { label: "Select Loan Type", value: "" },
          { label: "Building", value: "BUILDING_LOAN" },
          { label: "Car", value: "CAR_LOAN" },
        ]}
      />

      <InputField
        label="Repayment Of Loans From Govt."
        name="loanRepayGovt"
        register={register}
      />
      <InputField
        label="Repayment Of Loans From Other Sources"
        name="loanRepayOther"
        register={register}
      />
      <InputField
        label="Security Deposit"
        name="securityDeposit"
        register={register}
      />
      <InputField
        label="Earnest Money"
        name="earnestMoney"
        register={register}
      />
      <InputField
        label="Payment For Transferred Items"
        name="transferPayment"
        register={register}
      />
      <InputField
        label="Gross Amount"
        name="grossAmount"
        register={register}
        readonly
      />
    </>
  );
};

export default AmountBreakupSection;
