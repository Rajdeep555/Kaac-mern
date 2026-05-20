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
  const [headFieldsUnlocked, setHeadFieldsUnlocked] = useState(false);
  const majorHeadChangedByUser = useRef(false);

  // Tracks whether selectedMajor effect is running for the first time
  const isFirstMajorRender = useRef(true);

  const [sector, setSector] = useState("");

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
    control, // ← required by new SelectField
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      challanNo: "",
      challanDate: "",
      stateNo: "",
      from: "",
      to: "",
      subject: "",
      sector: "",
      ddo: "",
      divisionCode: "",
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
    },
  });

  const totalAmount = watch("totalAmount");
  const watchedSector = watch("sector");

  // Watched head values — used by cascade useEffects
  const watchedMajorHead = watch("majorHead");
  const watchedSubMajorHead = watch("subMajorHead");
  const watchedMinorHead = watch("minorHead");
  const watchedSubHead = watch("subHead");
  const watchedSubSubHead = watch("subSubHead");
  const watchedDetailHead = watch("detailHead");

  // ─── Sync sector state for useHeadHierarchy in create mode ────────────────
  useEffect(() => {
    if (!isEditMode) setSector(watchedSector);
  }, [watchedSector, isEditMode]);

  // ─── Amount → Words ────────────────────────────────────────────────────────
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

  // ─── Fetch + prefill in edit mode ─────────────────────────────────────────
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

        setValue("challanNo", data.challanNo ?? "");
        setValue("challanDate", data.challanDate?.slice(0, 10) ?? "");
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

        // Cascade-fetch all dropdown options using saved codes
        if (data.majorHead) {
          await fetchSubMajors(data.majorHead, data.sector);
        }
        if (data.majorHead && data.subMajorHead) {
          await fetchMinors({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
          });
        }
        if (data.majorHead && data.subMajorHead && data.minorHead) {
          await fetchSubHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
          });
        }
        if (
          data.majorHead &&
          data.subMajorHead &&
          data.minorHead &&
          data.subHead
        ) {
          await fetchSubSubHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
          });
        }
        if (
          data.majorHead &&
          data.subMajorHead &&
          data.minorHead &&
          data.subHead &&
          data.subSubHead
        ) {
          await fetchDetailHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
            subSubHeadCode: data.subSubHead,
          });
        }
        if (
          data.majorHead &&
          data.subMajorHead &&
          data.minorHead &&
          data.subHead &&
          data.subSubHead &&
          data.detailHead
        ) {
          await fetchSubDetailHeads({
            sectorOverride: data.sector,
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
            subSubHeadCode: data.subSubHead,
            detailHeadCode: data.detailHead,
          });
        }
      } catch {
        showToast("Failed to load challan", "error");
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [id]);

  // ─── Detect user-driven Major Head change ─────────────────────────────────
  // Skip the very first run (initial mount / edit pre-fill).
  useEffect(() => {
    if (isFirstMajorRender.current) {
      isFirstMajorRender.current = false;
      return;
    }
    majorHeadChangedByUser.current = true;
    setHeadFieldsUnlocked(true);
  }, [watchedMajorHead]);

  // ─── Cascade: Major Head → fetch Sub Majors (create mode only) ────────────
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

  // ─── Cascade: Sub Major → fetch Minors ────────────────────────────────────
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

  // ─── Cascade: Minor → fetch Sub Heads ─────────────────────────────────────
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

  // ─── Cascade: Sub Head → fetch Sub Sub Heads ──────────────────────────────
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

  // ─── Cascade: Sub Sub Head → fetch Detail Heads ───────────────────────────
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

  // ─── Cascade: Detail Head → fetch Sub Detail Heads ────────────────────────
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

  // ─── Sector change in create mode — reset all head fields ─────────────────
  // Handled reactively: watchedSector change → setSector → useHeadHierarchy resets
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

  // ─── Resolve display label from loaded options array ──────────────────────
  const getLabel = (options, value) => {
    if (!value) return "—";
    const found = options.find((o) => String(o.value) === String(value));
    return found ? found.label : value;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const payload = {
        challanNo: data.challanNo,
        challanDate: data.challanDate,
        stateNo: data.stateNo,
        from: data.from,
        to: data.to,
        subject: data.subject,
        sector: data.sector,
        ddo: data.ddo,
        divisionCode: data.divisionCode,
        majorHead: data.majorHead,
        subMajorHead: data.subMajorHead,
        minorHead: data.minorHead,
        subHead: data.subHead,
        subSubHead: data.subSubHead,
        detailHead: data.detailHead,
        subDetailHead: data.subDetailHead,
        purpose: data.purpose,
        remarks: data.remarks,
        totalAmount: data.totalAmount,
        amountInWords: data.amountInWords,
        focNo: data.focNo,
        sanctionLetterNo: data.sanctionLetterNo,
        sanctionLetterDate: data.sanctionLetterDate,
        treasuryCode: data.treasuryCode,
        treasuryChallanNo: data.treasuryChallanNo,
      };

      console.log(payload);

      if (isEditMode) {
        await update(id, payload);
        showToast("State Challan updated successfully!", "success");
        navigate("/state-challan");
      } else {
        await create(payload);
        showToast("State Challan created successfully!", "success");
        reset();
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
          <svg
            className="animate-spin h-8 w-8"
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
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-sm">Loading challan data...</span>
        </div>
      </div>
    );
  }

  const HeadLoadingBar = () =>
    headLoading ? (
      <div className="col-span-full flex items-center gap-2 text-sm text-zinc-500 py-1">
        <svg
          className="animate-spin h-4 w-4"
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
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        Loading head data...
      </div>
    ) : null;

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
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
        <InputField
          label="Challan No."
          name="challanNo"
          register={register}
          {...register("challanNo")}
        />
        <DateField
          label="Date"
          name="challanDate"
          register={register}
          {...register("challanDate")}
        />
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

        {/* ── DDO ── */}
        <SelectField
          label="DDO"
          name="ddo"
          control={control}
          removable
          disabled={ddoLoading}
          options={ddoOptions}
        />

        {/* ── Division Code ── */}
        <SelectField
          label="Division Code"
          name="divisionCode"
          control={control}
          removable
          disabled={divisionLoading}
          options={divisionSelectOptions}
        />

        <HeadLoadingBar />

        {/* ── Major Head — always a dropdown; useEffect above handles unlock + cascade ── */}
        <SelectField
          label="Major Head"
          name="majorHead"
          control={control}
          disabled={headLoading || (!isEditMode && !watchedSector)}
          options={majorHeads}
        />

        {/* ── Sub Major Head ── */}
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

        {/* ── Minor Head ── */}
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

        {/* ── Sub Head ── */}
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

        {/* ── Sub Sub Head ── */}
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

        {/* ── Detail Head ── */}
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

        {/* ── Sub Detail Head ── */}
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
          label="Amount Concurred (In Lakhs)"
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
        <InputField
          label="Treasury Code"
          name="treasuryCode"
          register={register}
          {...register("treasuryCode")}
        />
        <InputField
          label="Treasury Challan No"
          name="treasuryChallanNo"
          register={register}
          {...register("treasuryChallanNo")}
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
