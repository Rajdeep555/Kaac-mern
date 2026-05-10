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

  // Sync sector state for useHeadHierarchy in create mode
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

  // Fetch + prefill in edit mode
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

        // Prefill all form fields
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

        // Set sector for useHeadHierarchy
        setSector(data.sector ?? "");

        // Save raw codes for locked readonly labels
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

        // Cascade fetch all dropdown options using data.* directly
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

  // Resolve display label from loaded options array
  const getLabel = (options, value) => {
    if (!value) return "—";
    const found = options.find((o) => String(o.value) === String(value));
    return found ? found.label : value;
  };

  // Major Head change → unlock all cascade dropdowns
  const handleMajorHeadChange = (e) => {
    majorHeadChangedByUser.current = true;
    setHeadFieldsUnlocked(true);
    setValue("majorHead", e.target.value);
    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
    if (e.target.value) fetchSubMajors(e.target.value);
  };

  // Sector change in create mode
  const handleSectorChange = (e) => {
    setValue("sector", e.target.value);
    setValue("majorHead", "");
    setValue("subMajorHead", "");
    setValue("minorHead", "");
    setValue("subHead", "");
    setValue("subSubHead", "");
    setValue("detailHead", "");
    setValue("subDetailHead", "");
  };

  const onSubmit = async (data) => {
    try {
      // Explicit payload — never send extra fields
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

        {/* Sector */}
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
            register={register}
            options={[
              { label: "Select Sector", value: "" },
              { label: "STATE", value: "STATE" },
            ]}
            {...register("sector", { onChange: handleSectorChange })}
          />
        )}

        {/* DDO */}
        <SelectField
          label="DDO"
          name="ddo"
          register={register}
          removable
          disabled={ddoLoading}
          options={ddoOptions}
          {...register("ddo")}
        />

        {/* Division Code */}
        <SelectField
          label="Division Code"
          name="divisionCode"
          register={register}
          removable
          disabled={divisionLoading}
          options={divisionSelectOptions}
          {...register("divisionCode")}
        />

        <HeadLoadingBar />

        {/* Major Head — always dropdown, onChange unlocks rest */}
        <SelectField
          label="Major Head"
          name="majorHead"
          register={register}
          disabled={headLoading || (!isEditMode && !watchedSector)}
          options={majorHeads}
          {...register("majorHead", { onChange: handleMajorHeadChange })}
        />

        {/* Sub Major Head */}
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
            register={register}
            removable
            disabled={headLoading}
            options={subMajors}
            {...register("subMajorHead", {
              onChange: (e) => {
                setValue("subMajorHead", e.target.value);
                setValue("minorHead", "");
                setValue("subHead", "");
                setValue("subSubHead", "");
                setValue("detailHead", "");
                setValue("subDetailHead", "");
                if (e.target.value)
                  fetchMinors({
                    majorHeadCode: watch("majorHead"),
                    subMajorCode: e.target.value,
                  });
              },
            })}
          />
        )}

        {/* Minor Head */}
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
            register={register}
            removable
            disabled={headLoading}
            options={minors}
            {...register("minorHead", {
              onChange: (e) => {
                setValue("minorHead", e.target.value);
                setValue("subHead", "");
                setValue("subSubHead", "");
                setValue("detailHead", "");
                setValue("subDetailHead", "");
                if (e.target.value)
                  fetchSubHeads({
                    majorHeadCode: watch("majorHead"),
                    subMajorCode: watch("subMajorHead"),
                    minorHeadCode: e.target.value,
                  });
              },
            })}
          />
        )}

        {/* Sub Head */}
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
            register={register}
            removable
            disabled={headLoading}
            options={subHeads}
            {...register("subHead", {
              onChange: (e) => {
                setValue("subHead", e.target.value);
                setValue("subSubHead", "");
                setValue("detailHead", "");
                setValue("subDetailHead", "");
                if (e.target.value)
                  fetchSubSubHeads({
                    majorHeadCode: watch("majorHead"),
                    subMajorCode: watch("subMajorHead"),
                    minorHeadCode: watch("minorHead"),
                    subHeadCode: e.target.value,
                  });
              },
            })}
          />
        )}

        {/* Sub Sub Head */}
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
            register={register}
            removable
            disabled={headLoading}
            options={subSubHeads}
            {...register("subSubHead", {
              onChange: (e) => {
                setValue("subSubHead", e.target.value);
                setValue("detailHead", "");
                setValue("subDetailHead", "");
                if (e.target.value)
                  fetchDetailHeads({
                    majorHeadCode: watch("majorHead"),
                    subMajorCode: watch("subMajorHead"),
                    minorHeadCode: watch("minorHead"),
                    subHeadCode: watch("subHead"),
                    subSubHeadCode: e.target.value,
                  });
              },
            })}
          />
        )}

        {/* Detail Head */}
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
            register={register}
            removable
            disabled={headLoading}
            options={detailHeads}
            {...register("detailHead", {
              onChange: (e) => {
                setValue("detailHead", e.target.value);
                setValue("subDetailHead", "");
                if (e.target.value)
                  fetchSubDetailHeads({
                    majorHeadCode: watch("majorHead"),
                    subMajorCode: watch("subMajorHead"),
                    minorHeadCode: watch("minorHead"),
                    subHeadCode: watch("subHead"),
                    subSubHeadCode: watch("subSubHead"),
                    detailHeadCode: e.target.value,
                  });
              },
            })}
          />
        )}

        {/* Sub Detail Head */}
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
            register={register}
            removable
            disabled={headLoading}
            options={subDetailHeads}
            {...register("subDetailHead")}
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
