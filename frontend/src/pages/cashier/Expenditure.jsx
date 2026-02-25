import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

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
import { usePlanNonPlan } from "../../hooks/usePlanNonPlan.js";
import { getFinancialYears } from "../../hooks/useFinancialYear.js";
import { useObjectHead } from "../../hooks/useObjectHead.js";

import { getGeneratedVoucherNo } from "../../api/autoChallan.api.js";
import {
  createExpenditure,
  updateExpenditure,
  getExpenditureById,
} from "../../api/expenditure.api.js";
import { useForm } from "react-hook-form";
import BasicDetailsSection from "../../components/Expenditure/BasicDetailsSection.jsx";
import HeadHierarchySection from "../../components/Expenditure/HeadHierarchySection.jsx";
import AmountBreakupSection from "../../components/Expenditure/AmountBreakupSection.jsx";
import DeductionsSection from "../../components/Expenditure/DeductionsSection.jsx";
import { useGrants } from "../../hooks/useGrants.js";
import TableButton from "../../components/ui/TableButton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const Expenditure = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // NEW STATE: Track when data is fully loaded
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isExpenditureLoading, setIsExpenditureLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ================= BASIC DATA ================= */
  const { departments } = useDepartments({ type: "COUNCIL" });
  const { ddos } = useDdo();
  const { planNonPlan } = usePlanNonPlan();
  const financialYearOptions = getFinancialYears(2023).map((fy) => ({
    label: fy,
    value: fy,
  }));
  const { objectHead } = useObjectHead();
  const { grantOptions } = useGrants();

  /* ================= FORM ================= */
  const { register, handleSubmit, watch, setValue, reset } = useForm({
    defaultValues: {
      sector: "",
      department: "",
      ddo: "",
      division: "",

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

      salaryType: "SALARY",
      planType: "",
      financialYear: "",
      objectHead: "",

      payOfficers: "",
      payEstablishment: "",
      allowanceHonorary: "",
      contingencies: "",
      grantsInAid: "",
      works: "",
      loansAdvances: "",
      loanType: "",
      loanRepayGovt: "",
      loanRepayOther: "",
      securityDeposit: "",
      earnestMoney: "",
      transferPayment: "",

      grossAmount: "",

      cgst: "",
      sgst: "",
      igst: "",
      earnestMoneyDeduction: "",
      ptax: "",
      itax: "",
      carLoanRecovery: "",
      houseLoanRecovery: "",
      cpfCouncil: "",
      cpfContribution: "",
      cpfRecovery: "",
      houseRent: "",
      securityDepositsDeduction: "",
      forestRoyalty: "",
      monopoly: "",
      mcForestRoyalty: "",
      mdrrf: "",
      dmft: "",
      labourCess: "",
      itForestRoyalty: "",
      vat: "",
      advanceRecovery: "",
      otherDeductions: "",

      grossDeduction: "",
      cpfPayable: "",
      netDeduction: "",
      netAmount: "",
      amountPayable: "",
      amountInWords: "",

      remarks: "",

      chequeBookNo: "",
      chequeNo: "",
      chequeIssueDate: "",
      treasuryName: "",
      treasuryVoucherNo: "",
      treasuryDate: "",
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
  const loansAdvances = watch("loansAdvances");

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
  } = useHeadHierarchy(sector, isEditMode);

  /* ================= LOAD DATA FOR EDIT MODE ================= */
  useEffect(() => {
    if (isEditMode && id) {
      const loadExpenditure = async () => {
        setIsExpenditureLoading(true);
        try {
          const response = await getExpenditureById(id);
          const data = response.data.data; // FIXED: unwrap the nested data

          // Helper to format ISO date → "YYYY-MM-DD" for <input type="date">
          const toDateInput = (isoStr) => {
            if (!isoStr) return "";
            try {
              return new Date(isoStr).toISOString().split("T")[0];
            } catch {
              return "";
            }
          };

          const flatData = {
            ...data,

            // Flatten department/ddo objects → just the ID string
            department: String(data.departmentId ?? data.department?.id ?? ""),
            ddo: String(data.ddoId ?? data.ddo?.id ?? ""),

            // Format ISO dates → "YYYY-MM-DD" for date inputs
            voucherDate: toDateInput(data.voucherDate),
            requisitionDate: toDateInput(data.requisitionDate),
            chequeIssueDate: toDateInput(data.chequeIssueDate),
            treasuryDate: toDateInput(data.treasuryDate),
          };

          console.log("FLAT DATA FOR RESET:", flatData); // Should now show all real values
          reset(flatData);
          setIsDataLoaded(true);
        } catch (error) {
          console.error("Failed to load expenditure", error);
          toast.error("Failed to load expenditure data");
          navigate("/expenditures");
        } finally {
          setIsExpenditureLoading(false);
        }
      };

      loadExpenditure();
    } else {
      // For create mode, data is "loaded" immediately
      setIsDataLoaded(true);
    }
  }, [id, isEditMode, navigate, reset]);

  /* ================= RESET ALL ON SECTOR CHANGE ================= */
  useEffect(() => {
    if (!sector || !isDataLoaded || isEditMode) return;

    setValue("majorHead", "");
    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [sector, setValue, isDataLoaded, isEditMode]);

  /* ================= MAJOR → SUB MAJOR ================= */
  useEffect(() => {
    if (!majorHead || !isDataLoaded || isEditMode) return;

    fetchSubMajors(majorHead);

    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [majorHead, isDataLoaded, isEditMode]);

  /* ================= SUB MAJOR → MINOR ================= */
  useEffect(() => {
    if (!subMajorHead || !isDataLoaded || isEditMode) return;

    fetchMinors({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
    });

    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [subMajorHead, majorHead, isDataLoaded, isEditMode]);

  /* ================= MINOR → SUB HEAD ================= */
  useEffect(() => {
    if (!minorHead || !isDataLoaded || isEditMode) return;

    fetchSubHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
    });

    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [minorHead, majorHead, subMajorHead, isDataLoaded, isEditMode]);

  /* ================= SUB HEAD → SUB SUB HEAD ================= */
  useEffect(() => {
    if (subHead === "" || !isDataLoaded || isEditMode) return;

    fetchSubSubHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
      subHeadCode: subHead,
    });

    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [subHead, majorHead, subMajorHead, minorHead, isDataLoaded, isEditMode]);

  /* ================= SUB SUB HEAD → DETAIL ================= */
  useEffect(() => {
    if (subSubHead === "" || !isDataLoaded || isEditMode) return;

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
    isDataLoaded,
    isEditMode,
  ]);

  /* ================= DETAIL → SUB DETAIL ================= */
  useEffect(() => {
    if (!detailHead || !isDataLoaded || isEditMode) return;

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
    isDataLoaded,
    isEditMode,
  ]);

  /* ================= CALCULATE GROSS AMOUNT ================= */
  useEffect(() => {
    if (!isDataLoaded) return;

    const gross =
      Number(watch("payOfficers") || 0) +
      Number(watch("payEstablishment") || 0) +
      Number(watch("allowanceHonorary") || 0) +
      Number(watch("contingencies") || 0) +
      Number(watch("grantsInAid") || 0) +
      Number(watch("works") || 0) +
      Number(watch("loansAdvances") || 0) +
      Number(watch("loanRepayGovt") || 0) +
      Number(watch("loanRepayOther") || 0) +
      Number(watch("securityDeposit") || 0) +
      Number(watch("earnestMoney") || 0) +
      Number(watch("transferPayment") || 0);

    setValue("grossAmount", gross, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [
    isDataLoaded,
    watch("payOfficers"),
    watch("payEstablishment"),
    watch("allowanceHonorary"),
    watch("contingencies"),
    watch("grantsInAid"),
    watch("works"),
    watch("loansAdvances"),
    watch("loanRepayGovt"),
    watch("loanRepayOther"),
    watch("securityDeposit"),
    watch("earnestMoney"),
    watch("transferPayment"),
  ]);

  /* ================= CALCULATE GROSS DEDUCTION ================= */
  useEffect(() => {
    if (!isDataLoaded) return;

    const grossDeduction =
      Number(watch("cgst") || 0) +
      Number(watch("sgst") || 0) +
      Number(watch("igst") || 0) +
      Number(watch("earnestMoneyDeduction") || 0) +
      Number(watch("ptax") || 0) +
      Number(watch("itax") || 0) +
      Number(watch("carLoanRecovery") || 0) +
      Number(watch("houseLoanRecovery") || 0) +
      Number(watch("cpfCouncil") || 0) +
      Number(watch("cpfContribution") || 0) +
      Number(watch("cpfRecovery") || 0) +
      Number(watch("houseRent") || 0) +
      Number(watch("securityDepositsDeduction") || 0) +
      Number(watch("forestRoyalty") || 0) +
      Number(watch("monopoly") || 0) +
      Number(watch("mcForestRoyalty") || 0) +
      Number(watch("mdrrf") || 0) +
      Number(watch("dmft") || 0) +
      Number(watch("labourCess") || 0) +
      Number(watch("itForestRoyalty") || 0) +
      Number(watch("vat") || 0) +
      Number(watch("advanceRecovery") || 0) +
      Number(watch("otherDeductions") || 0);

    setValue("grossDeduction", grossDeduction, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [
    isDataLoaded,
    watch("cgst"),
    watch("sgst"),
    watch("igst"),
    watch("earnestMoneyDeduction"),
    watch("ptax"),
    watch("itax"),
    watch("carLoanRecovery"),
    watch("houseLoanRecovery"),
    watch("cpfCouncil"),
    watch("cpfContribution"),
    watch("cpfRecovery"),
    watch("houseRent"),
    watch("securityDepositsDeduction"),
    watch("forestRoyalty"),
    watch("monopoly"),
    watch("mcForestRoyalty"),
    watch("mdrrf"),
    watch("dmft"),
    watch("labourCess"),
    watch("itForestRoyalty"),
    watch("vat"),
    watch("advanceRecovery"),
    watch("otherDeductions"),
  ]);

  /* ================= CALCULATE CPF PAYABLE ================= */
  useEffect(() => {
    if (!isDataLoaded) return;

    const cpfPayable =
      Number(watch("cpfCouncil") || 0) +
      Number(watch("cpfContribution") || 0) +
      Number(watch("cpfRecovery") || 0);

    setValue("cpfPayable", cpfPayable, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [
    isDataLoaded,
    watch("cpfCouncil"),
    watch("cpfContribution"),
    watch("cpfRecovery"),
  ]);

  /* ================= CALCULATE NET DEDUCTION ================= */
  useEffect(() => {
    if (!isDataLoaded) return;

    const netDeduction =
      Number(watch("grossDeduction") || 0) - Number(watch("cpfPayable") || 0);

    setValue("netDeduction", netDeduction, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [isDataLoaded, watch("grossDeduction"), watch("cpfPayable")]);

  /* ================= CALCULATE NET AMOUNT ================= */
  useEffect(() => {
    if (!isDataLoaded) return;

    const netAmount =
      Number(watch("grossAmount") || 0) - Number(watch("netDeduction") || 0);

    setValue("netAmount", netAmount, {
      shouldDirty: false,
      shouldValidate: false,
    });
    setValue("amountPayable", netAmount, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [isDataLoaded, watch("grossAmount"), watch("netDeduction")]);

  /* ================= AMOUNT TO WORDS ================= */
  useEffect(() => {
    if (!isDataLoaded) return;

    const payable = watch("amountPayable");

    if (!payable || payable === 0) {
      setValue("amountInWords", "", {
        shouldDirty: false,
        shouldValidate: false,
      });
      return;
    }

    const words = rupeesToWords(payable);
    setValue("amountInWords", words, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [isDataLoaded, watch("amountPayable")]);

  /* ================= GET VOUCHER NO (CREATE MODE ONLY) ================= */
  useEffect(() => {
    if (isEditMode || !sector || !isDataLoaded) {
      return;
    }

    const fetchNextVoucherNo = async () => {
      setIsExpenditureLoading(true);
      try {
        const res = await getGeneratedVoucherNo(sector);
        setValue("voucherNo", res.data.voucherNo, {
          shouldDirty: false,
          shouldValidate: false,
        });
      } catch (error) {
        console.error("Failed to fetch voucher number", error);
        setValue("voucherNo", "ERROR");
        toast.error("Failed to generate voucher number");
      } finally {
        setIsExpenditureLoading(false);
      }
    };

    fetchNextVoucherNo();
  }, [sector, isEditMode, isDataLoaded]);

  /* ================= AUTO SELECT FINANCIAL YEAR ================= */
  useEffect(() => {
    if (isEditMode || !isDataLoaded) return;

    const currentFY = getFinancialYears(2023)[0];
    setValue("financialYear", currentFY, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [isEditMode, isDataLoaded]);

  /* ================= RESET LOAN TYPE ================= */
  useEffect(() => {
    if (!isDataLoaded) return;

    const amount = Number(loansAdvances);
    if (!amount || amount <= 0) {
      setValue("loanType", "", {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [loansAdvances, isDataLoaded]);

  /* ================= TRANSFORM DATA FOR BACKEND ================= */
  const transformDataForBackend = (data) => {
    const toNumber = (val) => {
      if (val === "" || val === null || val === undefined) return null;
      return Number(val);
    };

    // Convert date string to ISO format for backend
    const toISODate = (dateStr) => {
      if (!dateStr) return null;
      try {
        return new Date(dateStr).toISOString();
      } catch (e) {
        return null;
      }
    };

    return {
      sector: data.sector,
      voucherNo: data.voucherNo,
      voucherDate: toISODate(data.voucherDate),
      requisitionNo: data.requisitionNo || null,
      requisitionDate: toISODate(data.requisitionDate),
      grantNo: data.grantNo || null,

      // IMPORTANT: Make sure these are valid numbers
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

      remarks:
        typeof data.remarks === "string" && data.remarks.trim() !== ""
          ? data.remarks.trim()
          : null,

      chequeBookNo: data.chequeBookNo || null,
      chequeNo: data.chequeNo || null,
      chequeIssueDate: toISODate(data.chequeIssueDate),
      treasuryName: data.treasuryName || null,
      treasuryVoucherNo: data.treasuryVoucherNo || null,
      treasuryDate: toISODate(data.treasuryDate),
    };
  };

  /* ================= SUBMIT ================= */
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const payload = transformDataForBackend(data);

      // Log the payload for debugging
      // console.log(" SENDING PAYLOAD:", JSON.stringify(payload, null, 2));

      let response;
      if (isEditMode) {
        response = await updateExpenditure(id, payload);
        toast.success("Expenditure updated successfully!");
      } else {
        response = await createExpenditure(payload);
        toast.success("Expenditure created successfully!");
      }

      // console.log("Response:", response.data);
      if (!isEditMode) {
        reset(); // ✅ Clears all fields back to defaultValuesa
      }

      navigate("/expenditures");
    } catch (error) {
      console.error("Failed to submit expenditure", error);

      // Log detailed error information
      if (error.response) {
        console.error("Error Details:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.issues?.[0]?.message ||
        `Failed to ${isEditMode ? "update" : "create"} expenditure`;

      toast.error(errorMessage);

      // Log Zod validation errors in detail
      if (error.response?.data?.issues) {
        console.error("🔍 Validation Errors:", error.response.data.issues);
        error.response.data.issues.forEach((issue) => {
          console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      <div className="border-b border-zinc-400 leading-9">
        <div className="flex items-center justify-between">
          <Breadcrumbs
            items={[
              { label: "Dashboard", path: "/" },
              { label: "Expenditures", path: "/expenditures" }, // ✅ Fixed path
              {
                label: isEditMode ? "Edit Expenditure" : "Create Expenditure",
                path: "/expenditure",
              },
            ]}
          />

          <div>
            <TableButton
              onClick={() => navigate("/generated-expenditure")}
              icon
              name="Generated Expenditures"
            />
          </div>
        </div>

        <h1 className="font-unbounded">
          {isEditMode
            ? "Edit Expenditure Details :"
            : "Fill Expenditure Details :"}
        </h1>
      </div>

      <FormWrapper
        onSubmit={handleSubmit(onSubmit)}
        submitText={isEditMode ? "Update" : "Submit"}
        isSubmitting={isSubmitting}>
        <BasicDetailsSection
          register={register}
          departments={departments}
          ddos={ddos}
          grants={grantOptions}
          isExpenditureLoading={isExpenditureLoading}
        />

        {/* Work/Scheme Section */}
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
            {
              label: "Deposit Bearing / Non Bearing Interest",
              value: "DEPOSIT BEARING",
            },
          ]}
        />

        {/* Head Hierarchy */}
        <HeadHierarchySection
          register={register}
          loading={loading}
          isEditMode={isEditMode}
          sector={sector}
          majorHead={majorHead}
          subMajorHead={subMajorHead}
          minorHead={minorHead}
          subHead={subHead}
          subSubHead={subSubHead}
          detailHead={detailHead}
          majorHeads={majorHeads}
          subMajors={subMajors}
          minors={minors}
          subHeads={subHeads}
          subSubHeads={subSubHeads}
          detailHeads={detailHeads}
          subDetailHeads={subDetailHeads}
        />

        {/* Classification */}
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
          options={[{ label: "Select PlanNonPlan", value: "" }, ...planNonPlan]}
        />

        <SelectField
          label="Financial Year"
          name="financialYear"
          register={register}
          options={[
            { label: "Select Financial Year", value: "" },
            ...financialYearOptions,
          ]}
        />

        <SelectField
          label="Object Head"
          name="objectHead"
          register={register}
          options={[...objectHead]}
        />

        {/* Amount Breakup */}
        <AmountBreakupSection
          register={register}
          loansAdvances={loansAdvances}
        />

        {/* Deductions */}
        <DeductionsSection register={register} />

        {/* Remarks */}
        <TextAreaField
          label="Narration / Remarks"
          name="remarks"
          register={register}
        />

        {/* Cheque & Treasury Details */}
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
