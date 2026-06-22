import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";
import FormWrapper from "../../components/Forms/FormWrapper";
import InputField from "../../components/Forms/InputField";
import SelectField from "../../components/Forms/SelectField";
import TextAreaField from "../../components/Forms/TextAreaField";
import DateField from "../../components/Forms/DateField";
import { rupeesToWords } from "../../utils/rupeesToWords";
import { formatIndianNumber } from "../../utils/formatIndianCurrency";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import { useHeadHierarchy } from "../../hooks/useHeadHierarchy";
import { useStateChallan } from "../../hooks/useStateChallan";
import { useDdo } from "../../hooks/useDDO";
import { useDivisions } from "../../hooks/useDivisions.js";
import { showToast } from "../../utils/toast.js";

// ─── Financial Year helpers ────────────────────────────────────────────────
const generateFinancialYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear - 3; y <= currentYear + 1; y++) {
    years.push({ label: `${y}-${y + 1}`, value: `${y}-${y + 1}` });
  }
  return years;
};

const FY_MONTHS = [
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
];

const calendarYearForMonth = (fyString, monthValue) => {
  if (!fyString) return new Date().getFullYear();
  const startYear = parseInt(fyString.split("-")[0], 10);
  return parseInt(monthValue, 10) >= 4 ? startYear : startYear + 1;
};

const getMonthBounds = (fyString, monthValue) => {
  if (!fyString || !monthValue) return { min: "", max: "" };
  const calYear = calendarYearForMonth(fyString, monthValue);
  const mm = monthValue;
  const lastDay = new Date(calYear, parseInt(mm, 10), 0).getDate();
  return {
    min: `${calYear}-${mm}-01`,
    max: `${calYear}-${mm}-${String(lastDay).padStart(2, "0")}`,
  };
};

const TREASURY_OPTIONS = [
  { label: "Select Treasury", value: "" },
  { label: "01-Diphu", value: "01-Diphu" },
  { label: "02-Hamren", value: "02-Hamren" },
  { label: "03-Bukajan", value: "03-Bukajan" },
];

// ─── Success Modal ─────────────────────────────────────────────────────────
const ChallanSuccessModal = ({ challanNo, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-zinc-800">Challan Created!</h2>
      <p className="text-sm text-zinc-500 text-center">
        Your State Challan has been saved. The assigned Challan No. is:
      </p>
      <div className="bg-zinc-100 rounded-lg px-6 py-3 text-2xl font-bold text-zinc-800 tracking-widest select-all font-mono">
        {challanNo}
      </div>
      <p className="text-xs text-zinc-400 text-center">
        Please note this number for your records.
      </p>
      <button
        onClick={onClose}
        className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
        Done
      </button>
    </div>
  </div>
);

// ─── Spinner ───────────────────────────────────────────────────────────────
const Spinner = ({ size = 8 }) => (
  <svg
    className={`animate-spin h-${size} w-${size}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);

const StateChallan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const {
    create,
    update,
    fetchById,
    loading: submitLoading,
  } = useStateChallan();
  const { ddos, loading: ddoLoading } = useDdo();
  const { divisionOptions, loading: divisionLoading } = useDivisions();

  const [pageLoading, setPageLoading] = useState(isEditMode);
  const [editLabels, setEditLabels] = useState(null);
  const [existingChallanNo, setExistingChallanNo] = useState(""); // shown in edit mode
  const [headFieldsUnlocked, setHeadFieldsUnlocked] = useState(false);
  const majorHeadChangedByUser = useRef(false);
  const isFirstMajorRender = useRef(true);

  const [sector, setSector] = useState("");

  // FY / Month
  const [selectedFY, setSelectedFY] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Success modal
  const [generatedChallanNo, setGeneratedChallanNo] = useState(null);

  const financialYearOptions = [
    { label: "Select Financial Year", value: "" },
    ...generateFinancialYears(),
  ];

  const { min: dateMin, max: dateMax } = getMonthBounds(
    selectedFY,
    selectedMonth,
  );

  const {
    loading: headLoading,
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      challanDate: "",
      stateNo: "",
      from: "",
      to: "",
      subject: "",
      sector: "",
      ddo: "",
      divisionCode: "",
      grantNo: "",
      majorHead: "",
      subMajorHead: "",
      minorHead: "",
      subHead: "",
      subSubHead: "",
      detailHead: "",
      subDetailHead: "",
      purpose: "",
      remarks: "",
      totalAmount: "",
      amountInWords: "",
      focNo: "",
      sanctionLetterNo: "",
      sanctionLetterDate: "",
      treasuryCode: "",
      treasuryChallanNo: "",
      treasuryChallanDate: "",
    },
  });

  const totalAmount = watch("totalAmount");
  const watchedSector = watch("sector");
  const watchedMajorHead = watch("majorHead");
  const watchedSubMajorHead = watch("subMajorHead");
  const watchedMinorHead = watch("minorHead");
  const watchedSubHead = watch("subHead");
  const watchedSubSubHead = watch("subSubHead");
  const watchedDetailHead = watch("detailHead");

  // Reset challanDate when FY or month changes
  useEffect(() => {
    setValue("challanDate", "");
  }, [selectedFY, selectedMonth]);

  // Sync sector for head hierarchy
  useEffect(() => {
    if (!isEditMode) setSector(watchedSector);
  }, [watchedSector, isEditMode]);

  // Amount → Words
  useEffect(() => {
    if (!totalAmount) {
      setValue("amountInWords", "");
      return;
    }
    const raw = totalAmount.toString().replace(/,/g, "");
    if (isNaN(raw)) return;
    setValue("totalAmount", formatIndianNumber(raw));
    setValue("amountInWords", rupeesToWords(raw));
  }, [totalAmount, setValue]);

  // ── Fetch + prefill in edit mode ────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    const load = async () => {
      setPageLoading(true);
      try {
        const data = await fetchById(id);
        if (!data) {
          showToast("Challan not found", "error");
          return;
        }

        // Store the existing challanNo for display
        setExistingChallanNo(data.challanNo ?? "");

        // Restore FY + month from stored date
        if (data.challanDate) {
          const d = new Date(data.challanDate);
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yyyy = d.getFullYear();
          const fyStart = parseInt(mm, 10) >= 4 ? yyyy : yyyy - 1;
          setSelectedFY(`${fyStart}-${fyStart + 1}`);
          setSelectedMonth(mm);
          setValue("challanDate", data.challanDate.slice(0, 10));
        }

        setValue("stateNo", data.stateNo ?? "");
        setValue("from", data.from ?? "");
        setValue("to", data.to ?? "");
        setValue("subject", data.subject ?? "");
        setValue("sector", data.sector ?? "");
        setValue("ddo", data.ddo ? String(data.ddo) : "");
        setValue(
          "divisionCode",
          data.divisionCode ? String(data.divisionCode) : "",
        );
        setValue("grantNo", data.grantNo ?? "");
        setValue("majorHead", data.majorHead ?? "");
        setValue("subMajorHead", data.subMajorHead ?? "");
        setValue("minorHead", data.minorHead ?? "");
        setValue("subHead", data.subHead ?? "");
        setValue("subSubHead", data.subSubHead ?? "");
        setValue("detailHead", data.detailHead ?? "");
        setValue("subDetailHead", data.subDetailHead ?? "");
        setValue("purpose", data.purpose ?? "");
        setValue("remarks", data.remarks ?? "");
        setValue(
          "totalAmount",
          data.totalAmount ? formatIndianNumber(String(data.totalAmount)) : "",
        );
        setValue("amountInWords", data.amountInWords ?? "");
        setValue("focNo", data.focNo ?? "");
        setValue("sanctionLetterNo", data.sanctionLetterNo ?? "");
        setValue(
          "sanctionLetterDate",
          data.sanctionLetterDate?.slice(0, 10) ?? "",
        );
        setValue("treasuryCode", data.treasuryCode ?? "");
        setValue("treasuryChallanNo", data.treasuryChallanNo ?? "");
        setValue(
          "treasuryChallanDate",
          data.treasuryChallanDate?.slice(0, 10) ?? "",
        );

        setSector(data.sector ?? "");
        setEditLabels({
          sector: data.sector ?? "",
          ddo: data.ddo ? String(data.ddo) : "",
          divisionCode: data.divisionCode ? String(data.divisionCode) : "",
          majorHead: data.majorHead ?? "",
          subMajorHead: data.subMajorHead ?? "",
          minorHead: data.minorHead ?? "",
          subHead: data.subHead ?? "",
          subSubHead: data.subSubHead ?? "",
          detailHead: data.detailHead ?? "",
          subDetailHead: data.subDetailHead ?? "",
        });

        if (data.majorHead) await fetchSubMajors(data.majorHead, data.sector);
        if (data.majorHead && data.subMajorHead)
          await fetchMinors({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
          });
        if (data.majorHead && data.subMajorHead && data.minorHead)
          await fetchSubHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
          });
        if (
          data.majorHead &&
          data.subMajorHead &&
          data.minorHead &&
          data.subHead
        )
          await fetchSubSubHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
          });
        if (
          data.majorHead &&
          data.subMajorHead &&
          data.minorHead &&
          data.subHead &&
          data.subSubHead
        )
          await fetchDetailHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
            subSubHeadCode: data.subSubHead,
          });
        if (
          data.majorHead &&
          data.subMajorHead &&
          data.minorHead &&
          data.subHead &&
          data.subSubHead &&
          data.detailHead
        )
          await fetchSubDetailHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
            subSubHeadCode: data.subSubHead,
            detailHeadCode: data.detailHead,
          });
      } catch {
        showToast("Failed to load challan", "error");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  // Detect user-driven Major Head change
  useEffect(() => {
    if (isFirstMajorRender.current) {
      isFirstMajorRender.current = false;
      return;
    }
    majorHeadChangedByUser.current = true;
    setHeadFieldsUnlocked(true);
  }, [watchedMajorHead]);

  // Cascade effects
  useEffect(() => {
    if (!watchedMajorHead || !majorHeadChangedByUser.current) return;
    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
    fetchSubMajors(watchedMajorHead);
  }, [watchedMajorHead]);

  useEffect(() => {
    if (!watchedSubMajorHead || !majorHeadChangedByUser.current) return;
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
    fetchMinors({
      majorHeadCode: watchedMajorHead,
      subMajorCode: watchedSubMajorHead,
    });
  }, [watchedSubMajorHead]);

  useEffect(() => {
    if (!watchedMinorHead || !majorHeadChangedByUser.current) return;
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
    fetchSubHeads({
      majorHeadCode: watchedMajorHead,
      subMajorCode: watchedSubMajorHead,
      minorHeadCode: watchedMinorHead,
    });
  }, [watchedMinorHead]);

  useEffect(() => {
    if (!watchedSubHead || !majorHeadChangedByUser.current) return;
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
    fetchSubSubHeads({
      majorHeadCode: watchedMajorHead,
      subMajorCode: watchedSubMajorHead,
      minorHeadCode: watchedMinorHead,
      subHeadCode: watchedSubHead,
    });
  }, [watchedSubHead]);

  useEffect(() => {
    if (!watchedSubSubHead || !majorHeadChangedByUser.current) return;
    setValue("detailHead", "");
    setValue("subDetailHead", "");
    fetchDetailHeads({
      majorHeadCode: watchedMajorHead,
      subMajorCode: watchedSubMajorHead,
      minorHeadCode: watchedMinorHead,
      subHeadCode: watchedSubHead,
      subSubHeadCode: watchedSubSubHead,
    });
  }, [watchedSubSubHead]);

  useEffect(() => {
    if (!watchedDetailHead || !majorHeadChangedByUser.current) return;
    setValue("subDetailHead", "");
    fetchSubDetailHeads({
      majorHeadCode: watchedMajorHead,
      subMajorCode: watchedSubMajorHead,
      minorHeadCode: watchedMinorHead,
      subHeadCode: watchedSubHead,
      subSubHeadCode: watchedSubSubHead,
      detailHeadCode: watchedDetailHead,
    });
  }, [watchedDetailHead]);

  useEffect(() => {
    if (isEditMode) return;
    setValue("majorHead", "");
    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  }, [watchedSector, isEditMode]);

  const getLabel = (options, value) => {
    if (!value) return "—";
    const found = options.find((o) => String(o.value) === String(value));
    return found ? found.label : value;
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const onSubmit = async (formData) => {
    try {
      const payload = {
        challanDate: formData.challanDate,
        stateNo: formData.stateNo,
        from: formData.from,
        to: formData.to,
        subject: formData.subject,
        sector: formData.sector,
        ddo: formData.ddo,
        divisionCode: formData.divisionCode,
        grantNo: formData.grantNo,
        majorHead: formData.majorHead,
        subMajorHead: formData.subMajorHead,
        minorHead: formData.minorHead,
        subHead: formData.subHead,
        subSubHead: formData.subSubHead,
        detailHead: formData.detailHead,
        subDetailHead: formData.subDetailHead,
        purpose: formData.purpose,
        remarks: formData.remarks,
        totalAmount: formData.totalAmount,
        amountInWords: formData.amountInWords,
        focNo: formData.focNo,
        sanctionLetterNo: formData.sanctionLetterNo,
        sanctionLetterDate: formData.sanctionLetterDate,
        treasuryCode: formData.treasuryCode,
        treasuryChallanNo: formData.treasuryChallanNo,
        treasuryChallanDate: formData.treasuryChallanDate,
        // challanNo is intentionally NOT sent — DB generates it
      };

      if (isEditMode) {
        await update(id, payload);
        showToast("State Challan updated successfully!", "success");
        navigate("/state-challan");
      } else {
        // hook returns the full API body: { success, challanNo, data: {...} }
        const result = await create(payload);
        const assignedNo = result?.challanNo ?? result?.data?.challanNo ?? "—";
        setGeneratedChallanNo(assignedNo);
        reset();
        setSelectedFY("");
        setSelectedMonth("");
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Something went wrong!",
        "error",
      );
    }
  };

  const headFieldsLocked = isEditMode && !headFieldsUnlocked;

  const ddoOptions = [
    { label: ddoLoading ? "Loading DDOs..." : "Select DDO", value: "" },
    ...ddos,
  ];
  const divisionSelectOptions = [
    {
      label: divisionLoading ? "Loading Divisions..." : "Select Division",
      value: "",
    },
    ...divisionOptions,
  ];

  if (pageLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Spinner size={8} />
          <span className="text-sm">Loading challan data...</span>
        </div>
      </div>
    );
  }

  const HeadLoadingBar = () =>
    headLoading ? (
      <div className="col-span-full flex items-center gap-2 text-sm text-zinc-500 py-1">
        <Spinner size={4} />
        Loading head data...
      </div>
    ) : null;

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      {/* Success modal */}
      {generatedChallanNo && (
        <ChallanSuccessModal
          challanNo={generatedChallanNo}
          onClose={() => {
            setGeneratedChallanNo(null);
            navigate("/state-challan");
          }}
        />
      )}

      <div className="border-b border-zinc-400 leading-9">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "State Challan", path: "/state-challan" },
            {
              label: isEditMode ? "Edit State Challan" : "Create State Challan",
              path: "/state-challan",
            },
          ]}
        />
        <h1 className="font-unbounded">
          {isEditMode
            ? "Edit State Challan Details :"
            : "Fill State Challan Details :"}
        </h1>
      </div>

      <FormWrapper
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting || submitLoading}
        submitText={isEditMode ? "Update Challan" : "Create Challan"}>
        {/* ── Financial Year ── */}
        <div className="col-span-full">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Financial Year <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedFY}
            onChange={(e) => {
              setSelectedFY(e.target.value);
              setSelectedMonth("");
            }}>
            {financialYearOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Month ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Month <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
            value={selectedMonth}
            disabled={!selectedFY}
            onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">Select Month</option>
            {FY_MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Challan Date — native date picker clamped to selected month ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Challan Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            min={dateMin}
            max={dateMax}
            disabled={!selectedMonth}
            className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
            {...register("challanDate", {
              required: "Challan date is required",
              validate: (v) => {
                if (dateMin && v < dateMin)
                  return `Date must be within selected month`;
                if (dateMax && v > dateMax)
                  return `Date must be within selected month`;
                return true;
              },
            })}
          />
          {dateMin && dateMax && (
            <p className="mt-1 text-xs text-zinc-400">
              Valid range: {dateMin} → {dateMax}
            </p>
          )}
          {errors.challanDate && (
            <p className="mt-1 text-xs text-red-500">
              {errors.challanDate.message}
            </p>
          )}
        </div>

        {/* ── Challan No — read-only display ── */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Challan No.
          </label>
          <div className="w-full border border-dashed border-zinc-300 rounded-md px-3 py-2 text-sm bg-zinc-50">
            {isEditMode && existingChallanNo ? (
              <span className="font-mono font-semibold text-zinc-700">
                {existingChallanNo}
              </span>
            ) : (
              <span className="italic text-zinc-400">
                Auto-assigned on save (e.g. STATE-2026-01)
              </span>
            )}
          </div>
        </div>

        <InputField
          label="No."
          name="stateNo"
          register={register}
          {...register("stateNo")}
        />
        <InputField
          label="From"
          name="from"
          register={register}
          {...register("from")}
        />
        <InputField
          label="To"
          name="to"
          register={register}
          {...register("to")}
        />
        <InputField
          label="Subject"
          name="subject"
          register={register}
          {...register("subject")}
        />

        {/* ── Sector ── */}
        {headFieldsLocked && editLabels ? (
          <InputField
            label="Sector"
            name="sector"
            register={register}
            readonly={true}
            defaultValue={editLabels.sector}
            {...register("sector")}
          />
        ) : (
          <SelectField
            label="Sector *"
            name="sector"
            control={control}
            options={[
              { label: "Select Sector", value: "" },
              { label: "STATE", value: "STATE" },
            ]}
          />
        )}

        <SelectField
          label="DDO"
          name="ddo"
          control={control}
          removable
          disabled={ddoLoading}
          options={ddoOptions}
        />
        <SelectField
          label="Division Code"
          name="divisionCode"
          control={control}
          removable
          disabled={divisionLoading}
          options={divisionSelectOptions}
        />

        <HeadLoadingBar />

        {/* ── Grant No ── */}
        <InputField
          label="Grant No"
          name="grantNo"
          register={register}
          {...register("grantNo")}
        />

        {/* ── Major Head ── */}
        <SelectField
          label="Major Head"
          name="majorHead"
          control={control}
          disabled={headLoading || (!isEditMode && !watchedSector)}
          options={majorHeads}
        />

        {headFieldsLocked && editLabels ? (
          <InputField
            label="Sub Major Head"
            name="subMajorHead"
            register={register}
            readonly={true}
            defaultValue={getLabel(subMajors, editLabels.subMajorHead)}
            {...register("subMajorHead")}
          />
        ) : (
          <SelectField
            label="Sub Major Head"
            name="subMajorHead"
            control={control}
            removable
            disabled={headLoading}
            options={subMajors}
          />
        )}

        {headFieldsLocked && editLabels ? (
          <InputField
            label="Minor Head"
            name="minorHead"
            register={register}
            readonly={true}
            defaultValue={getLabel(minors, editLabels.minorHead)}
            {...register("minorHead")}
          />
        ) : (
          <SelectField
            label="Minor Head"
            name="minorHead"
            control={control}
            removable
            disabled={headLoading}
            options={minors}
          />
        )}

        {headFieldsLocked && editLabels ? (
          <InputField
            label="Sub Head"
            name="subHead"
            register={register}
            readonly={true}
            defaultValue={getLabel(subHeads, editLabels.subHead)}
            {...register("subHead")}
          />
        ) : (
          <SelectField
            label="Sub Head"
            name="subHead"
            control={control}
            removable
            disabled={headLoading}
            options={subHeads}
          />
        )}

        {headFieldsLocked && editLabels ? (
          <InputField
            label="Sub Sub Head"
            name="subSubHead"
            register={register}
            readonly={true}
            defaultValue={getLabel(subSubHeads, editLabels.subSubHead)}
            {...register("subSubHead")}
          />
        ) : (
          <SelectField
            label="Sub Sub Head"
            name="subSubHead"
            control={control}
            removable
            disabled={headLoading}
            options={subSubHeads}
          />
        )}

        {headFieldsLocked && editLabels ? (
          <InputField
            label="Detail Head"
            name="detailHead"
            register={register}
            readonly={true}
            defaultValue={getLabel(detailHeads, editLabels.detailHead)}
            {...register("detailHead")}
          />
        ) : (
          <SelectField
            label="Detail Head"
            name="detailHead"
            control={control}
            removable
            disabled={headLoading}
            options={detailHeads}
          />
        )}

        {headFieldsLocked && editLabels ? (
          <InputField
            label="Sub Detail Head"
            name="subDetailHead"
            register={register}
            readonly={true}
            defaultValue={getLabel(subDetailHeads, editLabels.subDetailHead)}
            {...register("subDetailHead")}
          />
        ) : (
          <SelectField
            label="Sub Detail Head"
            name="subDetailHead"
            control={control}
            removable
            disabled={headLoading}
            options={subDetailHeads}
          />
        )}

        <InputField
          label="Purpose"
          name="purpose"
          register={register}
          {...register("purpose")}
        />
        <InputField
          label="Amount Concurred (₹)"
          name="totalAmount"
          register={register}
          {...register("totalAmount")}
        />
        <InputField
          label="Amount In Words"
          name="amountInWords"
          register={register}
          readonly={true}
          {...register("amountInWords")}
        />
        <InputField
          label="FOC No"
          name="focNo"
          register={register}
          {...register("focNo")}
        />
        <InputField
          label="Sanction Letter No"
          name="sanctionLetterNo"
          register={register}
          {...register("sanctionLetterNo")}
        />
        <DateField
          label="Sanction Letter Date"
          name="sanctionLetterDate"
          register={register}
          {...register("sanctionLetterDate")}
        />
        <SelectField
          label="Treasury Code"
          name="treasuryCode"
          control={control}
          options={TREASURY_OPTIONS}
        />
        <InputField
          label="Treasury Challan No"
          name="treasuryChallanNo"
          register={register}
          {...register("treasuryChallanNo")}
        />
        <DateField
          label="Treasury Challan Date"
          name="treasuryChallanDate"
          register={register}
          {...register("treasuryChallanDate")}
        />
        <TextAreaField
          label="Remarks"
          name="remarks"
          register={register}
          {...register("remarks")}
        />
      </FormWrapper>
    </div>
  );
};

export default StateChallan;
