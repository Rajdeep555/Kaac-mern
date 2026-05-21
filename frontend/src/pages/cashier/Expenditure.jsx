import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Breadcrumbs from "../../components/ui/Breadcrumbs";
import FormWrapper from "../../components/Forms/FormWrapper";
import InputField from "../../components/Forms/InputField";
import SelectField from "../../components/Forms/SelectField";
import TextAreaField from "../../components/Forms/TextAreaField";
import DateField from "../../components/Forms/DateField";
import AlertModal from "../../components/ui/AlertModal";

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
import { useExpenditureTypes } from "../../hooks/useExpenditureTypes.js";

// ✅ Indian FY helper (April–March)
const getFinancialYearFromDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  const month = date.getMonth();
  const year = date.getFullYear();
  const fyStart = month >= 3 ? year : year - 1;
  return `${fyStart}-${fyStart + 1}`;
};

// ✅ Default alert state — reused to reset
const DEFAULT_ALERT = {
  isOpen: false,
  title: "",
  message: "",
  isSuccess: true,
};

const Expenditure = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isExpenditureLoading, setIsExpenditureLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDepartmentId, setSavedDepartmentId] = useState(null);
  const [savedDdoId, setSavedDdoId] = useState(null);

  // ✅ Saved head values for edit mode pre-population
  const [savedHeads, setSavedHeads] = useState(null);

  // ✅ Ref to suppress cascade clears during initial edit-mode data load
  const isCascadeLockedRef = useRef(false);

  // ✅ Alert modal state
  const [alertModal, setAlertModal] = useState(DEFAULT_ALERT);

  const closeAlert = () => {
    const wasSuccess = alertModal.isSuccess;
    setAlertModal(DEFAULT_ALERT);
    if (wasSuccess) navigate("/expenditures");
  };

  /* ================= FORM ================= */
  const { register, handleSubmit, watch, setValue, reset, control } = useForm({
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

      payOfficers: 0,
      payEstablishment: 0,
      allowanceHonorary: 0,
      contingencies: 0,
      grantsInAid: 0,
      works: 0,
      loansAdvances: 0,
      loanType: "",
      loanRepayGovt: 0,
      loanRepayOther: 0,
      securityDeposit: 0,
      earnestMoney: 0,
      transferPayment: 0,

      grossAmount: 0,

      cgst: 0,
      sgst: 0,
      igst: 0,
      earnestMoneyDeduction: 0,
      ptax: 0,
      itax: 0,
      carLoanRecovery: 0,
      houseLoanRecovery: 0,
      cpfCouncil: 0,
      cpfContribution: 0,
      cpfRecovery: 0,
      houseRent: 0,
      securityDepositsDeduction: 0,
      forestRoyalty: 0,
      monopoly: 0,
      mcForestRoyalty: 0,
      mdrrf: 0,
      dmft: 0,
      labourCess: 0,
      itForestRoyalty: 0,
      vat: 0,
      advanceRecovery: 0,
      otherDeductions: 0,

      grossDeduction: 0,
      cpfPayable: 0,
      netDeduction: 0,
      netAmount: 0,
      amountPayable: 0,

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
  const voucherDate = watch("voucherDate");
  const majorHead = watch("majorHead");
  const subMajorHead = watch("subMajorHead");
  const minorHead = watch("minorHead");
  const subHead = watch("subHead");
  const subSubHead = watch("subSubHead");
  const detailHead = watch("detailHead");
  const loansAdvances = watch("loansAdvances");

  /* ================= BASIC DATA ================= */
  const { departments, loading: depsLoading } = useDepartments({
    type: sector || "",
  });
  const { ddos } = useDdo();
  const { planNonPlan } = usePlanNonPlan();
  const { expenditureTypeOptions } = useExpenditureTypes();
  const { objectHeadOptions } = useObjectHead();
  const { grantOptions } = useGrants();

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
        isCascadeLockedRef.current = true;
        try {
          const response = await getExpenditureById(id);
          const data = response.data.data;

          const toDateInput = (isoStr) => {
            if (!isoStr) return "";
            try {
              return new Date(isoStr).toISOString().split("T")[0];
            } catch {
              return "";
            }
          };

          const deptId = String(data.departmentId ?? data.department?.id ?? "");
          const ddoId = String(data.ddoId ?? data.ddo?.id ?? "");
          setSavedDepartmentId(deptId);
          setSavedDdoId(ddoId);

          // ✅ Save all head values so we can re-apply after fetching option lists
          setSavedHeads({
            majorHead: data.majorHead || "",
            subMajorHead: data.subMajorHead || "",
            minorHead: data.minorHead || "",
            subHead: data.subHead || "",
            subSubHead: data.subSubHead || "",
            detailHead: data.detailHead || "",
            subDetailHead: data.subDetailHead || "",
          });

          const flatData = {
            ...data,
            department: deptId,
            ddo: ddoId,
            voucherDate: toDateInput(data.voucherDate),
            requisitionDate: toDateInput(data.requisitionDate),
            chequeIssueDate: toDateInput(data.chequeIssueDate),
            treasuryDate: toDateInput(data.treasuryDate),
          };

          reset(flatData);
          setIsDataLoaded(true);
        } catch (error) {
          console.error("Failed to load expenditure", error);
          setAlertModal({
            isOpen: true,
            title: "Failed to Load",
            message:
              "Could not load expenditure data. Redirecting back to list.",
            isSuccess: false,
          });
        } finally {
          setIsExpenditureLoading(false);
          setTimeout(() => {
            isCascadeLockedRef.current = false;
          }, 300);
        }
      };
      loadExpenditure();
    } else {
      setIsDataLoaded(true);
    }
  }, [id, isEditMode, navigate, reset]);

  /* ================= PRE-POPULATE HEAD DROPDOWNS IN EDIT MODE ================= */
  // Runs once after data loads + sector is set — fetches all option lists in
  // sequence and re-applies saved values so every dropdown is pre-selected.
  useEffect(() => {
    if (!isEditMode || !savedHeads || !sector || !isDataLoaded) return;
    if (!savedHeads.majorHead) return;

    const populateHeads = async () => {
      isCascadeLockedRef.current = true;
      try {
        const {
          majorHead,
          subMajorHead,
          minorHead,
          subHead,
          subSubHead,
          detailHead,
          subDetailHead,
        } = savedHeads;

        // Step 1 — fetch subMajors for majorHead, then restore majorHead
        await fetchSubMajors(majorHead);
        setValue("majorHead", majorHead, { shouldDirty: false });

        if (subMajorHead) {
          // Step 2 — fetch minors, restore subMajorHead
          await fetchMinors({
            majorHeadCode: majorHead,
            subMajorCode: subMajorHead,
          });
          setValue("subMajorHead", subMajorHead, { shouldDirty: false });
        }

        if (minorHead) {
          // Step 3 — fetch subHeads, restore minorHead
          await fetchSubHeads({
            majorHeadCode: majorHead,
            subMajorCode: subMajorHead,
            minorHeadCode: minorHead,
          });
          setValue("minorHead", minorHead, { shouldDirty: false });
        }

        if (subHead) {
          // Step 4 — fetch subSubHeads, restore subHead
          await fetchSubSubHeads({
            majorHeadCode: majorHead,
            subMajorCode: subMajorHead,
            minorHeadCode: minorHead,
            subHeadCode: subHead,
          });
          setValue("subHead", subHead, { shouldDirty: false });
        }

        if (subSubHead) {
          // Step 5 — fetch detailHeads, restore subSubHead
          await fetchDetailHeads({
            majorHeadCode: majorHead,
            subMajorCode: subMajorHead,
            minorHeadCode: minorHead,
            subHeadCode: subHead,
            subSubHeadCode: subSubHead,
          });
          setValue("subSubHead", subSubHead, { shouldDirty: false });
        }

        if (detailHead) {
          // Step 6 — fetch subDetailHeads, restore detailHead
          await fetchSubDetailHeads({
            majorHeadCode: majorHead,
            subMajorCode: subMajorHead,
            minorHeadCode: minorHead,
            subHeadCode: subHead,
            subSubHeadCode: subSubHead,
            detailHeadCode: detailHead,
          });
          setValue("detailHead", detailHead, { shouldDirty: false });
        }

        if (subDetailHead) {
          setValue("subDetailHead", subDetailHead, { shouldDirty: false });
        }
      } catch (err) {
        console.error("Failed to populate head hierarchy in edit mode", err);
      } finally {
        setTimeout(() => {
          isCascadeLockedRef.current = false;
        }, 100);
      }
    };

    populateHeads();
    // ✅ Only run once when savedHeads + sector are both ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, savedHeads, sector, isDataLoaded]);

  /* ================= RE-APPLY DEPARTMENT AFTER DEPARTMENTS LOAD ================= */
  useEffect(() => {
    if (
      !isEditMode ||
      !savedDepartmentId ||
      depsLoading ||
      departments.length === 0
    )
      return;
    const exists = departments.some(
      (d) => String(d.value ?? d.id) === savedDepartmentId,
    );
    if (exists)
      setValue("department", savedDepartmentId, { shouldDirty: false });
  }, [departments, depsLoading, savedDepartmentId, isEditMode, setValue]);

  /* ================= RE-APPLY DDO AFTER DDOS LOAD ================= */
  useEffect(() => {
    if (!isEditMode || !savedDdoId || !ddos || ddos.length === 0) return;
    const exists = ddos.some((d) => String(d.value ?? d.id) === savedDdoId);
    if (exists) setValue("ddo", savedDdoId, { shouldDirty: false });
  }, [ddos, savedDdoId, isEditMode, setValue]);

  /* ================= RESET ALL ON SECTOR CHANGE ================= */
  useEffect(() => {
    if (!sector || !isDataLoaded || isCascadeLockedRef.current) return;
    setValue("department", "");
    setValue("ddo", "");
    setValue("majorHead", "");
    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [sector, setValue, isDataLoaded]);

  /* ================= MAJOR → SUB MAJOR ================= */
  useEffect(() => {
    if (!majorHead || !isDataLoaded || isCascadeLockedRef.current) return;
    fetchSubMajors(majorHead);
    setValue("subMajorHead", "", { shouldDirty: false });
    setValue("minorHead", "", { shouldDirty: false });
    setValue("subHead", "", { shouldDirty: false });
    setValue("subSubHead", "", { shouldDirty: false });
    setValue("detailHead", "", { shouldDirty: false });
    setValue("subDetailHead", "", { shouldDirty: false });
  }, [majorHead, isDataLoaded, fetchSubMajors, setValue]);

  /* ================= SUB MAJOR → MINOR ================= */
  useEffect(() => {
    if (!subMajorHead || !isDataLoaded || isCascadeLockedRef.current) return;
    fetchMinors({ majorHeadCode: majorHead, subMajorCode: subMajorHead });
    setValue("minorHead", "", { shouldDirty: false });
    setValue("subHead", "", { shouldDirty: false });
    setValue("subSubHead", "", { shouldDirty: false });
    setValue("detailHead", "", { shouldDirty: false });
    setValue("subDetailHead", "", { shouldDirty: false });
  }, [subMajorHead, majorHead, isDataLoaded, fetchMinors, setValue]);

  /* ================= MINOR → SUB HEAD ================= */
  useEffect(() => {
    if (!minorHead || !isDataLoaded || isCascadeLockedRef.current) return;
    fetchSubHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
    });
    setValue("subHead", "", { shouldDirty: false });
    setValue("subSubHead", "", { shouldDirty: false });
    setValue("detailHead", "", { shouldDirty: false });
    setValue("subDetailHead", "", { shouldDirty: false });
  }, [
    minorHead,
    majorHead,
    subMajorHead,
    isDataLoaded,
    fetchSubHeads,
    setValue,
  ]);

  /* ================= SUB HEAD → SUB SUB HEAD ================= */
  useEffect(() => {
    if (subHead === "" || !isDataLoaded || isCascadeLockedRef.current) return;
    fetchSubSubHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
      subHeadCode: subHead,
    });
    setValue("subSubHead", "", { shouldDirty: false });
    setValue("detailHead", "", { shouldDirty: false });
    setValue("subDetailHead", "", { shouldDirty: false });
  }, [
    subHead,
    majorHead,
    subMajorHead,
    minorHead,
    isDataLoaded,
    fetchSubSubHeads,
    setValue,
  ]);

  /* ================= SUB SUB HEAD → DETAIL ================= */
  useEffect(() => {
    if (subSubHead === "" || !isDataLoaded || isCascadeLockedRef.current)
      return;
    fetchDetailHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
      subHeadCode: subHead,
      subSubHeadCode: subSubHead,
    });
    setValue("detailHead", "", { shouldDirty: false });
    setValue("subDetailHead", "", { shouldDirty: false });
  }, [
    subSubHead,
    majorHead,
    subMajorHead,
    minorHead,
    subHead,
    isDataLoaded,
    fetchDetailHeads,
    setValue,
  ]);

  /* ================= DETAIL → SUB DETAIL ================= */
  useEffect(() => {
    if (!detailHead || !isDataLoaded || isCascadeLockedRef.current) return;
    fetchSubDetailHeads({
      majorHeadCode: majorHead,
      subMajorCode: subMajorHead,
      minorHeadCode: minorHead,
      subHeadCode: subHead,
      subSubHeadCode: subSubHead,
      detailHeadCode: detailHead,
    });
    setValue("subDetailHead", "", { shouldDirty: false });
  }, [
    detailHead,
    majorHead,
    subMajorHead,
    minorHead,
    subHead,
    subSubHead,
    isDataLoaded,
    fetchSubDetailHeads,
    setValue,
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
    setValue,
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
    setValue,
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
    setValue,
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
  }, [isDataLoaded, watch("grossDeduction"), watch("cpfPayable"), setValue]);

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
  }, [isDataLoaded, watch("grossAmount"), watch("netDeduction"), setValue]);

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
    setValue("amountInWords", rupeesToWords(payable), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [isDataLoaded, watch("amountPayable"), setValue]);

  /* ================= GET VOUCHER NO (CREATE MODE ONLY) ================= */
  useEffect(() => {
    if (isEditMode || !sector || !isDataLoaded) return;
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
        setAlertModal({
          isOpen: true,
          title: "Voucher Error",
          message: "Failed to generate voucher number. Please try again.",
          isSuccess: false,
        });
      } finally {
        setIsExpenditureLoading(false);
      }
    };
    fetchNextVoucherNo();
  }, [sector, isEditMode, isDataLoaded, setValue]);

  /* ================= RESET LOAN TYPE ================= */
  useEffect(() => {
    if (!isDataLoaded) return;
    const amount = Number(loansAdvances);
    if (!amount || amount <= 0) {
      setValue("loanType", "", { shouldDirty: false, shouldValidate: false });
    }
  }, [loansAdvances, isDataLoaded, setValue]);

  /* ================= TRANSFORM DATA FOR BACKEND ================= */
  const transformDataForBackend = (data) => {
    const toNumber = (val) => {
      if (val === "" || val === null || val === undefined) return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    };
    const toISODate = (dateStr) => {
      if (!dateStr) return null;
      try {
        return new Date(dateStr).toISOString();
      } catch {
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
      departmentId: data.department ? Number(data.department) : null,
      ddoId: data.ddo ? Number(data.ddo) : null,
      workName: data.workName || null,
      expenditureType: data.expenditureType,
      majorHead: data.majorHead || "",
      subMajorHead: data.subMajorHead || "",
      minorHead: data.minorHead || "",
      subHead: data.subHead || "",
      subSubHead: data.subSubHead || "",
      detailHead: data.detailHead || "",
      subDetailHead: data.subDetailHead || "",
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
      grossAmount: toNumber(data.grossAmount),
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
      grossDeduction: toNumber(data.grossDeduction),
      cpfPayable: toNumber(data.cpfPayable),
      netDeduction: toNumber(data.netDeduction),
      netAmount: toNumber(data.netAmount),
      amountPayable: toNumber(data.amountPayable),
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
      console.log("SENDING PAYLOAD:", JSON.stringify(payload, null, 2));

      if (isEditMode) {
        await updateExpenditure(id, payload);
      } else {
        await createExpenditure(payload);
        reset();
      }

      setAlertModal({
        isOpen: true,
        title: "✅ Success",
        message: isEditMode
          ? "Expenditure has been updated successfully."
          : "New expenditure has been created successfully.",
        isSuccess: true,
      });
    } catch (error) {
      console.error("Failed to submit expenditure", error);
      if (error.response) {
        console.error("Error Details:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.response?.data?.issues?.[0]?.message ||
        `Failed to ${isEditMode ? "update" : "create"} expenditure`;

      setAlertModal({
        isOpen: true,
        title: "❌ Error",
        message: errorMessage,
        isSuccess: false,
      });

      if (error.response?.data?.issues) {
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
              { label: "Expenditures", path: "/expenditures" },
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
          control={control}
          departments={departments}
          depsLoading={depsLoading}
          ddos={ddos}
          watch={watch}
          grants={grantOptions}
          isExpenditureLoading={isExpenditureLoading}
        />

        <InputField
          label="Name Of The Work / Scheme"
          name="workName"
          register={register}
        />

        <SelectField
          label="Expenditure Type"
          name="expenditureType"
          control={control}
          options={[{ label: "", value: "" }, ...expenditureTypeOptions]}
        />

        <HeadHierarchySection
          register={register}
          control={control}
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

        <SelectField
          label="Salary / Non Salary"
          name="salaryType"
          control={control}
          options={[
            { label: "Salary", value: "SALARY" },
            { label: "Non Salary", value: "NON_SALARY" },
          ]}
        />

        <SelectField
          label="Plan / Non-Plan"
          name="planType"
          control={control}
          options={[{ label: "Select PlanNonPlan", value: "" }, ...planNonPlan]}
        />

        <SelectField
          label="Object Head"
          name="objectHead"
          control={control}
          options={objectHeadOptions}
        />

        <AmountBreakupSection
          register={register}
          loansAdvances={loansAdvances}
        />
        <DeductionsSection register={register} />

        <TextAreaField
          label="Narration / Remarks"
          name="remarks"
          register={register}
        />
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
          control={control}
          removable
          options={[
            { value: "01", label: "01-Diphu" },
            { value: "02", label: "02-Hamren" },
            { value: "03", label: "03-Bokajan" },
          ]}
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

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        onConfirm={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="OK"
        cancelText=""
      />
    </div>
  );
};

export default Expenditure;
