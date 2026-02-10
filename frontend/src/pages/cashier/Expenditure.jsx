import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import Breadcrumbs from "../../components/ui/Breadcrumbs";
import FormWrapper from "../../components/Forms/FormWrapper";
import InputField from "../../components/Forms/InputField";
import SelectField from "../../components/Forms/SelectField";
import TextAreaField from "../../components/Forms/TextAreaField";
import DateField from "../../components/Forms/DateField";

import { rupeesToWords } from "../../utils/rupeesToWords";
import { formatIndianNumber } from "../../utils/formatIndianCurrency";

import { useDepartments } from "../../hooks/useDepartments.js";
import { useDdo } from "../../hooks/useDDO.js";
import { useHeadHierarchy } from "../../hooks/useHeadHierarchy.js";

const Expenditure = () => {
  /* ================= BASIC DATA ================= */
  const { departments } = useDepartments({ type: "COUNCIL" });
  const { ddos } = useDdo();

  /* ================= FORM ================= */
  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      sector: "",
      department: "",
      ddo: "",

      majorHead: "",
      subMajorHead: "",
      minorHead: "",
      subHead: "",
      subSubHead: "",
      detailHead: "",
      subDetailHead: "",

      voucherNo: "",
      voucherDate: "",
      requisitionNo: "",
      requisitionDate: "",
      grantNo: "",
      workName: "",
      expenditureType: "",

      totalAmount: "",
      amountInWords: "",
      remarks: "",
    },
  });

  /* ================= WATCH ================= */
  const sector = watch("sector");
  const majorHead = watch("majorHead");
  const subMajorHead = watch("subMajorHead");
  const minorHead = watch("minorHead");
  const subHead = watch("subHead");
  const subSubHead = watch("subSubHead");
  const detailHead = watch("detailHead");
  const totalAmount = watch("totalAmount");

  /* ================= HEAD HIERARCHY ================= */
  const {
    loading,
    majorHeads,
    subMajors,
    minors,
    subHeads,
    subSubHeads,
    detailHeads,
    subDetailHeads,
    fetchSubMajors,
    fetchMinors,
    fetchSubHeads,
    fetchSubSubHeads,
    fetchDetailHeads,
    fetchSubDetailHeads,
  } = useHeadHierarchy(sector);

  /* ================= RESET ALL ON SECTOR CHANGE ================= */
  useEffect(() => {
    if (!sector) return;

    setValue("majorHead", "");
    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [sector, setValue]);

  /* ================= MAJOR → SUB MAJOR ================= */
  useEffect(() => {
    if (!majorHead) return;

    fetchSubMajors(majorHead);

    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [majorHead, fetchSubMajors, setValue]);

  /* ================= SUB MAJOR → MINOR ================= */
  useEffect(() => {
    if (!subMajorHead) return;

    fetchMinors({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
    });

    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [subMajorHead, majorHead, fetchMinors, setValue]);

  /* ================= MINOR → SUB HEAD ================= */
  useEffect(() => {
    if (!minorHead) return;

    fetchSubHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
    });

    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [minorHead, majorHead, subMajorHead, fetchSubHeads, setValue]);

  /* ================= SUB HEAD → SUB SUB HEAD ================= */
  useEffect(() => {
    if (subHead === "") return;

    fetchSubSubHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
      subHeadCode: subHead,
    });

    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [subHead, majorHead, subMajorHead, minorHead, fetchSubSubHeads, setValue]);

  /* ================= SUB SUB HEAD → DETAIL ================= */
  useEffect(() => {
    if (subSubHead === "") return;

    fetchDetailHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
      subHeadCode: subHead,
      subSubHeadCode: subSubHead,
    });

    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [
    subSubHead,
    majorHead,
    subMajorHead,
    minorHead,
    subHead,
    fetchDetailHeads,
    setValue,
  ]);

  /* ================= DETAIL → SUB DETAIL ================= */
  useEffect(() => {
    if (!detailHead) return;

    fetchSubDetailHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
      subHeadCode: subHead,
      subSubHeadCode: subSubHead,
      detailHeadCode: detailHead,
    });

    setValue("subDetailHead", "");
  }, [
    detailHead,
    majorHead,
    subMajorHead,
    minorHead,
    subHead,
    subSubHead,
    fetchSubDetailHeads,
    setValue,
  ]);

  /* ================= AMOUNT TO WORDS ================= */
  useEffect(() => {
    if (!totalAmount) {
      setValue("amountInWords", "");
      return;
    }

    const raw = totalAmount.replace(/,/g, "");
    if (!isNaN(raw)) {
      setValue("totalAmount", formatIndianNumber(raw));
      setValue("amountInWords", rupeesToWords(raw));
    }
  }, [totalAmount, setValue]);

  /* ================= SUBMIT ================= */
  const onSubmit = (data) => {
    console.log("FINAL PAYLOAD 👉", data);
    alert("Form submitted (check console)");
  };

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      <div className="border-b border-zinc-400 leading-9">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Expenditure", path: "/expenditure" },
            { label: "Create Expenditure", path: "/expenditure" },
          ]}
        />

        <h1 className="font-unbounded">Fill Expenditure Details :</h1>
      </div>

      <FormWrapper onSubmit={handleSubmit(onSubmit)}>
        {/* ================= BASIC DETAILS ================= */}

        <SelectField
          label="Select Sector"
          name="sector"
          register={register}
          required
          options={[
            { label: "Select Sector", value: "" },
            { label: "01-COUNCIL", value: "COUNCIL" },
            { label: "02-STATE", value: "STATE" },
          ]}
        />

        <InputField
          label="Voucher No"
          name="voucherNo"
          register={register}
          readonly
          helperText="( Auto generated by system )"
        />

        <DateField label="Date" name="voucherDate" register={register} />

        <InputField
          label="Requisition No"
          name="requisitionNo"
          register={register}
        />

        <DateField
          label="Requisition Date"
          name="requisitionDate"
          register={register}
        />

        <SelectField
          label="Grant Name & No"
          name="grantNo"
          register={register}
          options={[{ label: "Select Grant", value: "" }]}
        />

        <SelectField
          label="Department Name & Code"
          name="department"
          register={register}
          options={[{ label: "Select Department", value: "" }, ...departments]}
        />

        <SelectField
          label="Select DDO"
          name="ddo"
          register={register}
          options={[{ label: "Select DDO", value: "" }, ...ddos]}
        />

        {/* ================= WORK / SCHEME ================= */}

        <InputField
          label="Name Of The Work / Scheme"
          name="workName"
          register={register}
        />

        <SelectField
          label="Expenditure Type"
          name="expenditureType"
          register={register}
          options={[
            { label: "Select Type", value: "" },
            { label: "Capital", value: "CAPITAL" },
            { label: "Revenue", value: "REVENUE" },
          ]}
        />

        {/* ================= HEAD OF ACCOUNT ================= */}

        <SelectField
          label="Major Head"
          name="majorHead"
          register={register}
          disabled={!sector || loading}
          options={[{ label: "Select Major Head", value: "" }, ...majorHeads]}
        />

        <SelectField
          label="Sub Major Head"
          name="subMajorHead"
          register={register}
          disabled={!majorHead || loading}
          options={[
            { label: "Select Sub Major Head", value: "" },
            ...subMajors,
          ]}
        />

        <SelectField
          label="Minor Head"
          name="minorHead"
          register={register}
          disabled={!subMajorHead || loading}
          options={[{ label: "Select Minor Head", value: "" }, ...minors]}
        />

        <SelectField
          label="Sub Head"
          name="subHead"
          register={register}
          disabled={!minorHead || loading}
          options={[{ label: "Select Sub Head", value: "" }, ...subHeads]}
        />

        <SelectField
          label="Sub Sub Head"
          name="subSubHead"
          register={register}
          disabled={subHead === "" || loading}
          options={[
            { label: "Select Sub Sub Head", value: "" },
            ...subSubHeads,
          ]}
        />

        <SelectField
          label="Detail Head"
          name="detailHead"
          register={register}
          disabled={subSubHead === "" || loading}
          options={[{ label: "Select Detail Head", value: "" }, ...detailHeads]}
        />

        <SelectField
          label="Sub Detail Head"
          name="subDetailHead"
          register={register}
          disabled={!detailHead || loading}
          options={[
            { label: "Select Sub Detail Head", value: "" },
            ...subDetailHeads,
          ]}
        />

        {/* ================= CLASSIFICATION ================= */}

        <SelectField
          label="Salary / Non Salary"
          name="salaryType"
          register={register}
          options={[
            { label: "Salary", value: "SALARY" },
            { label: "Non Salary", value: "NON_SALARY" },
          ]}
        />

        <SelectField
          label="Plan / Non-Plan"
          name="planType"
          register={register}
          options={[
            { label: "Plan", value: "PLAN" },
            { label: "Non-Plan", value: "NON_PLAN" },
          ]}
        />

        <SelectField
          label="Financial Year"
          name="financialYear"
          register={register}
          options={[]}
        />

        <SelectField
          label="Object Head"
          name="objectHead"
          register={register}
          options={[]}
        />

        {/* ================= AMOUNT BREAKUP ================= */}

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
          options={[]}
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

        {/* ================= TOTAL ================= */}

        <InputField
          label="Gross Amount"
          name="grossAmount"
          register={register}
          readonly
        />

        {/* ================= DEDUCTIONS ================= */}

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
        <InputField
          label="CPF Recovery"
          name="cpfRecovery"
          register={register}
        />
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

        {/* ================= REMARKS ================= */}

        <TextAreaField
          label="Narration / Remarks"
          name="remarks"
          register={register}
        />

        {/* ================= CHEQUE & TREASURY DETAILS ================= */}

        <InputField
          label="Cheque Book No"
          name="chequeBookNo"
          register={register}
        />

        <InputField label="Cheque No" name="chequeNo" register={register} />

        <DateField
          label="Cheque Issue Date"
          name="chequeIssueDate"
          register={register}
        />

        <SelectField
          label="Treasury Name"
          name="treasuryName"
          register={register}
          options={[]}
          removable
        />

        <InputField
          label="Treasury Voucher No"
          name="treasuryVoucherNo"
          register={register}
        />

        <DateField
          label="Treasury Date"
          name="treasuryDate"
          register={register}
        />
      </FormWrapper>
    </div>
  );
};

export default Expenditure;
