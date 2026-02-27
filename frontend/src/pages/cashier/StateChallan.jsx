import { useState, useEffect } from "react";
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
import { showToast } from "../../utils/toast.js";

const StateChallan = ({ existingData = null }) => {
  const isEditMode = !!existingData;
  const { create, update, loading: submitLoading } = useStateChallan();

  const [form, setForm] = useState({
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
  });

  // ✅ Prefill form in edit mode
  useEffect(() => {
    if (isEditMode && existingData) {
      setForm({
        challanNo: existingData.challanNo ?? "",
        challanDate: existingData.challanDate?.slice(0, 10) ?? "",
        stateNo: existingData.stateNo ?? "",
        from: existingData.from ?? "",
        to: existingData.to ?? "",
        subject: existingData.subject ?? "",
        sector: existingData.sector ?? "",
        ddo: existingData.ddo ?? "",
        divisionCode: existingData.divisionCode ?? "",
        majorHead: existingData.majorHead ?? "",
        subMajorHead: existingData.subMajorHead ?? "",
        minorHead: existingData.minorHead ?? "",
        subHead: existingData.subHead ?? "",
        subSubHead: existingData.subSubHead ?? "",
        detailHead: existingData.detailHead ?? "",
        subDetailHead: existingData.subDetailHead ?? "",
        purpose: existingData.purpose ?? "",
        remarks: existingData.remarks ?? "",
        totalAmount: existingData.totalAmount
          ? formatIndianNumber(String(existingData.totalAmount))
          : "",
        amountInWords: existingData.amountInWords ?? "",
        focNo: existingData.focNo ?? "",
        sanctionLetterNo: existingData.sanctionLetterNo ?? "",
        sanctionLetterDate: existingData.sanctionLetterDate?.slice(0, 10) ?? "",
        treasuryCode: existingData.treasuryCode ?? "",
        treasuryChallanNo: existingData.treasuryChallanNo ?? "",
      });
    }
  }, [isEditMode, existingData]);

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
  } = useHeadHierarchy(form.sector, isEditMode);

  // ✅ Edit mode: cascade load all head levels
  useEffect(() => {
    if (isEditMode && form.sector && form.majorHead)
      fetchSubMajors(form.majorHead);
  }, [isEditMode, form.sector]);

  useEffect(() => {
    if (isEditMode && form.majorHead && form.subMajorHead)
      fetchMinors({
        majorHeadCode: form.majorHead,
        subMajorCode: form.subMajorHead,
      });
  }, [isEditMode, form.majorHead]);

  useEffect(() => {
    if (isEditMode && form.subMajorHead && form.minorHead)
      fetchSubHeads({
        majorHeadCode: form.majorHead,
        subMajorCode: form.subMajorHead,
        minorHeadCode: form.minorHead,
      });
  }, [isEditMode, form.subMajorHead]);

  useEffect(() => {
    if (isEditMode && form.minorHead && form.subHead)
      fetchSubSubHeads({
        majorHeadCode: form.majorHead,
        subMajorCode: form.subMajorHead,
        minorHeadCode: form.minorHead,
        subHeadCode: form.subHead,
      });
  }, [isEditMode, form.minorHead]);

  useEffect(() => {
    if (isEditMode && form.subHead && form.subSubHead)
      fetchDetailHeads({
        majorHeadCode: form.majorHead,
        subMajorCode: form.subMajorHead,
        minorHeadCode: form.minorHead,
        subHeadCode: form.subHead,
        subSubHeadCode: form.subSubHead,
      });
  }, [isEditMode, form.subHead]);

  useEffect(() => {
    if (isEditMode && form.subSubHead && form.detailHead)
      fetchSubDetailHeads({
        majorHeadCode: form.majorHead,
        subMajorCode: form.subMajorHead,
        minorHeadCode: form.minorHead,
        subHeadCode: form.subHead,
        subSubHeadCode: form.subSubHead,
        detailHeadCode: form.detailHead,
      });
  }, [isEditMode, form.subSubHead]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "sector") {
      setForm((prev) => ({
        ...prev,
        sector: value,
        majorHead: "",
        subMajorHead: "",
        minorHead: "",
        subHead: "",
        subSubHead: "",
        detailHead: "",
        subDetailHead: "",
      }));
      return;
    }
    if (name === "majorHead") {
      setForm((prev) => ({
        ...prev,
        majorHead: value,
        subMajorHead: "",
        minorHead: "",
        subHead: "",
        subSubHead: "",
        detailHead: "",
        subDetailHead: "",
      }));
      if (value) fetchSubMajors(value);
      return;
    }
    if (name === "subMajorHead") {
      setForm((prev) => ({
        ...prev,
        subMajorHead: value,
        minorHead: "",
        subHead: "",
        subSubHead: "",
        detailHead: "",
        subDetailHead: "",
      }));
      if (value)
        fetchMinors({ majorHeadCode: form.majorHead, subMajorCode: value });
      return;
    }
    if (name === "minorHead") {
      setForm((prev) => ({
        ...prev,
        minorHead: value,
        subHead: "",
        subSubHead: "",
        detailHead: "",
        subDetailHead: "",
      }));
      if (value)
        fetchSubHeads({
          majorHeadCode: form.majorHead,
          subMajorCode: form.subMajorHead,
          minorHeadCode: value,
        });
      return;
    }
    if (name === "subHead") {
      setForm((prev) => ({
        ...prev,
        subHead: value,
        subSubHead: "",
        detailHead: "",
        subDetailHead: "",
      }));
      if (value)
        fetchSubSubHeads({
          majorHeadCode: form.majorHead,
          subMajorCode: form.subMajorHead,
          minorHeadCode: form.minorHead,
          subHeadCode: value,
        });
      return;
    }
    if (name === "subSubHead") {
      setForm((prev) => ({
        ...prev,
        subSubHead: value,
        detailHead: "",
        subDetailHead: "",
      }));
      if (value)
        fetchDetailHeads({
          majorHeadCode: form.majorHead,
          subMajorCode: form.subMajorHead,
          minorHeadCode: form.minorHead,
          subHeadCode: form.subHead,
          subSubHeadCode: value,
        });
      return;
    }
    if (name === "detailHead") {
      setForm((prev) => ({ ...prev, detailHead: value, subDetailHead: "" }));
      if (value)
        fetchSubDetailHeads({
          majorHeadCode: form.majorHead,
          subMajorCode: form.subMajorHead,
          minorHeadCode: form.minorHead,
          subHeadCode: form.subHead,
          subSubHeadCode: form.subSubHead,
          detailHeadCode: value,
        });
      return;
    }
    if (name === "totalAmount") {
      const rawValue = value.replace(/,/g, "");
      setForm((prev) => ({
        ...prev,
        totalAmount: formatIndianNumber(rawValue),
        amountInWords: rupeesToWords(rawValue),
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await update(existingData.id, form);
        showToast("State Challan updated successfully!", "success");
      } else {
        await create(form);
        showToast("State Challan created successfully!", "success");

        setForm({
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
        });
      }
    } catch (err) {
      console.error(err);
      showToast(
        err?.response?.data?.message || "Something went wrong!",
        "error",
      );
    }
  };

  // ✅ Head loading indicator component
  const HeadLoadingBar = () =>
    headLoading ? (
      <div className="col-span-full flex items-center gap-2 text-sm text-zinc-500 py-1">
        <svg
          className="animate-spin h-4 w-4 text-zinc-500"
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
            { label: "Challan", path: "/challan" },
            {
              label: isEditMode ? "Edit State Challan" : "Create State Challan",
              path: "/challan",
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
        onSubmit={handleSubmit}
        isSubmitting={submitLoading}
        submitText={isEditMode ? "Update Challan" : "Create Challan"}>
        <InputField
          label="Challan No."
          name="challanNo"
          value={form.challanNo}
          onChange={handleChange}
        />
        <DateField
          label="Date"
          name="challanDate"
          value={form.challanDate}
          onChange={handleChange}
        />
        <InputField
          label="No."
          name="stateNo"
          value={form.stateNo}
          onChange={handleChange}
        />
        <InputField
          label="From"
          name="from"
          value={form.from}
          onChange={handleChange}
        />
        <InputField
          label="To"
          name="to"
          value={form.to}
          onChange={handleChange}
        />
        <InputField
          label="Subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
        />

        <SelectField
          label="Sector *"
          name="sector"
          value={form.sector}
          onChange={handleChange}
          options={[
            { label: "Select Sector", value: "" },
            { label: "COUNCIL", value: "COUNCIL" },
            { label: "STATE", value: "STATE" },
          ]}
        />

        <SelectField
          label="DDO"
          name="ddo"
          value={form.ddo}
          onChange={handleChange}
          removable
          options={[
            { label: "Select DDO", value: "" },
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Division Code"
          name="divisionCode"
          value={form.divisionCode}
          onChange={handleChange}
          removable
          options={[
            { label: "Select Division", value: "" },
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        {/* ✅ Loading bar shown while heads are being fetched */}
        <HeadLoadingBar />

        <SelectField
          label="Major Head"
          name="majorHead"
          value={form.majorHead}
          onChange={handleChange}
          removable
          disabled={headLoading || !form.sector}
          options={majorHeads}
        />

        <SelectField
          label="Sub Major Head"
          name="subMajorHead"
          value={form.subMajorHead}
          onChange={handleChange}
          removable
          disabled={headLoading || !form.majorHead}
          options={subMajors}
        />

        <SelectField
          label="Minor Head"
          name="minorHead"
          value={form.minorHead}
          onChange={handleChange}
          removable
          disabled={headLoading || !form.subMajorHead}
          options={minors}
        />

        <SelectField
          label="Sub Head"
          name="subHead"
          value={form.subHead}
          onChange={handleChange}
          removable
          disabled={headLoading || !form.minorHead}
          options={subHeads}
        />

        <SelectField
          label="Sub Sub Head"
          name="subSubHead"
          value={form.subSubHead}
          onChange={handleChange}
          removable
          disabled={headLoading || !form.subHead}
          options={subSubHeads}
        />

        <SelectField
          label="Detail Head"
          name="detailHead"
          value={form.detailHead}
          onChange={handleChange}
          removable
          disabled={headLoading || !form.subSubHead}
          options={detailHeads}
        />

        <SelectField
          label="Sub Detail Head"
          name="subDetailHead"
          value={form.subDetailHead}
          onChange={handleChange}
          removable
          disabled={headLoading || !form.detailHead}
          options={subDetailHeads}
        />

        <InputField
          label="Purpose"
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
        />
        <InputField
          label="Amount Concurred (In Lakhs)"
          name="totalAmount"
          value={form.totalAmount}
          onChange={handleChange}
        />
        <InputField
          label="Amount In Words"
          name="amountInWords"
          value={form.amountInWords}
          onChange={handleChange}
          readonly={true}
        />
        <InputField
          label="FOC No"
          name="focNo"
          value={form.focNo}
          onChange={handleChange}
        />
        <InputField
          label="Sanction Letter No"
          name="sanctionLetterNo"
          value={form.sanctionLetterNo}
          onChange={handleChange}
        />
        <DateField
          label="Sanction Letter Date"
          name="sanctionLetterDate"
          value={form.sanctionLetterDate}
          onChange={handleChange}
        />
        <InputField
          label="Treasury Code"
          name="treasuryCode"
          value={form.treasuryCode}
          onChange={handleChange}
        />
        <InputField
          label="Treasury Challan No"
          name="treasuryChallanNo"
          value={form.treasuryChallanNo}
          onChange={handleChange}
        />
        <TextAreaField
          label="Remarks"
          name="remarks"
          value={form.remarks}
          onChange={handleChange}
        />
      </FormWrapper>
    </div>
  );
};

export default StateChallan;
