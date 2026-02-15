import { useState } from "react";
import { useForm } from "react-hook-form";
import FormWrapper from "../../components/Forms/FormWrapper";
import InputField from "../../components/Forms/InputField";
import SelectField from "../../components/Forms/SelectField";
import TextAreaField from "../../components/Forms/TextAreaField";
import DateField from "../../components/Forms/DateField";
import { rupeesToWords } from "../../utils/rupeesToWords";
import { formatIndianNumber } from "../../utils/formatIndianCurrency";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import { useEffect, useRef } from "react";
import { getGeneratedChallanNo } from "../../api/autoChallan.api.js";
import { useDepartments } from "../../hooks/useDepartments.js";
import { useDivisions } from "../../hooks/useDivisions.js";
import { useDdo } from "../../hooks/useDDO.js";
import {
  createChallan,
  getChallanById,
  updateChallan,
} from "../../api/challan.api.js";
import { getCashReceiptByCounterfoil } from "../../api/cashReceipt.api.js";
import { showToast } from "../../utils/toast.js";
import { getAllChallanHead } from "../../api/challanHead.api.js";
import { useNavigate, useParams } from "react-router-dom";

const Challan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isChallanLoading, setIsChallanLoading] = useState(true);
  const [counterfoilError, setCounterfoilError] = useState("");
  const [heads, setHeads] = useState([]);

  const [majorOptions, setMajorOptions] = useState([]);
  const [subMajorOptions, setSubMajorOptions] = useState([]);
  const [subSubMajorOptions, setSubSubMajorOptions] = useState([]);
  const [minorOptions, setMinorOptions] = useState([]);
  const [detailOptions, setDetailOptions] = useState([]);

  // Stores the raw codes + display labels from the API response
  const [editLabels, setEditLabels] = useState(null);

  // Tracks if the user has manually changed Major Head while in edit mode.
  // Using useRef so flipping it doesn't cause an extra re-render cascade.
  const majorHeadChangedByUser = useRef(false);

  // Dummy state just to force a re-render when majorHeadChangedByUser flips
  const [headFieldsUnlocked, setHeadFieldsUnlocked] = useState(false);

  const { departments, loading: isDepartmentLoading } = useDepartments({
    type: "COUNCIL",
  });
  const { divisionOptions, loading: isDivisionLoading } = useDivisions();
  const { ddos, loading: isDdoLoading } = useDdo();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      challanType: "",
      department: "",
      divisionCode: "",
      ddo: "",
      majorHead: "",
      subMajorHead: "",
      subSubMajorHead: "",
      minorHead: "",
      detailHead: "",
      treasuryName: "",
      treasuryChallanNo: "",
      treasuryChallanDate: "",
      totalAmount: "",
      amountInWords: "",
      remarks: "",
    },
  });

  // ─── Fetch Challan for Edit ────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;

    const fetchChallan = async () => {
      try {
        const res = await getChallanById(id);
        if (res.data.success) {
          const data = res.data.data;

          // Fill all non-cascading fields immediately
          setValue("counterfoilNo", data.counterfoilNo || "");
          setValue(
            "counterfoilDate",
            data.counterfoilDate ? data.counterfoilDate.slice(0, 10) : "",
          );
          setValue("challanNo", data.challanNo || "");
          setValue(
            "challanDate",
            data.challanDate ? data.challanDate.slice(0, 10) : "",
          );
          setValue("challanType", data.challanType || "");
          setValue("department", data.departmentId);
          setValue("divisionCode", data.divisionId);
          setValue("ddo", data.ddoId);
          setValue("treasuryChallanNo", data.treasuryChallanNo);
          setValue(
            "treasuryChallanDate",
            data.treasuryChallanDate
              ? data.treasuryChallanDate.slice(0, 10)
              : "",
          );
          setValue("totalAmount", formatIndianNumber(data.amount));
          setValue("amountInWords", rupeesToWords(data.amount));
          setValue("remarks", data.remarks || "");

          // Set hidden form values for the head fields (needed for submit payload)
          setValue("majorHead", data.majorHead);
          setValue("subMajorHead", data.subMajorHead);
          setValue("subSubMajorHead", data.subSubMajorHead);
          setValue("minorHead", data.minorHead);
          setValue("detailHead", data.detailHead);
          setValue("treasuryName", data.treasuryCode);

          // Store raw codes — we will build display labels once heads are loaded
          setEditLabels({
            majorHead: data.majorHead,
            subMajorHead: data.subMajorHead,
            subSubMajorHead: data.subSubMajorHead,
            minorHead: data.minorHead,
            detailHead: data.detailHead,
            treasuryCode: data.treasuryCode,
          });
        }
      } catch (error) {
        showToast("Failed to fetch challan", "error");
      }
    };

    fetchChallan();
  }, [id, isEditMode, setValue]);

  const selectedMajor = watch("majorHead");
  const selectedSubMajor = watch("subMajorHead");
  const selectedSubSubMajor = watch("subSubMajorHead");
  const selectedMinor = watch("minorHead");

  // ─── Fetch All Challan Heads ───────────────────────────────────────────────
  useEffect(() => {
    const fetchHeads = async () => {
      const res = await getAllChallanHead();
      if (res.data.success) {
        const data = res.data.data;
        setHeads(data);

        const majors = [
          ...new Map(
            data
              .filter((h) => h.majorHeadCode && h.majorHeadCode !== "0")
              .map((h) => [
                h.majorHeadCode,
                {
                  label: `${h.majorHead} (${h.majorHeadCode})`,
                  value: h.majorHeadCode,
                },
              ]),
          ).values(),
        ];
        setMajorOptions(majors);
      }
    };
    fetchHeads();
  }, []);

  // ─── Sub Major Options (cascade from Major) ────────────────────────────────
  useEffect(() => {
    if (!selectedMajor) {
      setSubMajorOptions([]);
      return;
    }

    const subs = [
      ...new Map(
        heads
          .filter(
            (h) =>
              h.subMajorCode &&
              h.subMajorCode !== "0" &&
              h.subMajorParentCode === selectedMajor,
          )
          .map((h) => [
            h.subMajorCode,
            {
              label: `${h.subMajor} (${h.subMajorCode})`,
              value: h.subMajorCode,
            },
          ]),
      ).values(),
    ];
    setSubMajorOptions(subs);

    // Only clear downstream if user actively changed the major head
    if (majorHeadChangedByUser.current) {
      setValue("subMajorHead", "");
      setValue("subSubMajorHead", "");
      setValue("minorHead", "");
      setValue("detailHead", "");
    }
  }, [selectedMajor, heads]);

  // ─── Sub Sub Major Options ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSubMajor) {
      setSubSubMajorOptions([]);
      return;
    }

    const subSubs = [
      ...new Map(
        heads
          .filter((h) => h.subSubMajorParentCode === selectedSubMajor)
          .map((h) => [
            h.subSubMajorCode || "00",
            {
              label: `${h.subSubMajor || "Null"} (${h.subSubMajorCode || "00"})`,
              value: h.subSubMajorCode || "00",
            },
          ]),
      ).values(),
    ];
    setSubSubMajorOptions(subSubs);

    if (majorHeadChangedByUser.current) {
      setValue("subSubMajorHead", "");
      setValue("minorHead", "");
      setValue("detailHead", "");
    }
  }, [selectedSubMajor, heads]);

  // ─── Minor Options ─────────────────────────────────────────────────────────
  useEffect(() => {
    const parentCode =
      selectedSubSubMajor && selectedSubSubMajor !== "0"
        ? selectedSubSubMajor
        : selectedSubMajor;

    if (!parentCode) {
      setMinorOptions([]);
      return;
    }

    const minors = [
      ...new Map(
        heads
          .filter(
            (h) =>
              h.minorHeadCode &&
              h.minorHeadCode !== "0" &&
              h.minorHeadParentCode === parentCode,
          )
          .map((h) => [
            h.minorHeadCode,
            {
              label: `${h.minorHead} (${h.minorHeadCode})`,
              value: h.minorHeadCode,
            },
          ]),
      ).values(),
    ];
    setMinorOptions(minors);

    if (majorHeadChangedByUser.current) {
      setValue("minorHead", "");
      setValue("detailHead", "");
    }
  }, [selectedSubSubMajor, selectedSubMajor, heads]);

  // ─── Detail Options ────────────────────────────────────────────────────────
  useEffect(() => {
    const parentCode =
      selectedMinor && selectedMinor !== "0"
        ? selectedMinor
        : selectedSubSubMajor && selectedSubSubMajor !== "0"
          ? selectedSubSubMajor
          : selectedSubMajor;

    if (!parentCode) {
      setDetailOptions([]);
      return;
    }

    const details = [
      ...new Map(
        heads
          .filter((h) => h.detailHeadParentCode === parentCode)
          .map((h) => {
            const code =
              h.detailHeadCode && h.detailHeadCode !== "0"
                ? h.detailHeadCode
                : "00";
            const name =
              h.detailHead && h.detailHead.trim() !== ""
                ? h.detailHead
                : "Null";
            return [code, { label: `${name} (${code})`, value: code }];
          }),
      ).values(),
    ];
    setDetailOptions(details);

    if (majorHeadChangedByUser.current) {
      setValue("detailHead", "");
    }
  }, [selectedMinor, selectedSubSubMajor, selectedSubMajor, heads]);

  // ─── Counterfoil Lookup ────────────────────────────────────────────────────
  const totalAmount = watch("totalAmount");
  const counterfoilNo = watch("counterfoilNo");

  useEffect(() => {
    if (!counterfoilNo) return;
    const timer = setTimeout(async () => {
      try {
        const res = await getCashReceiptByCounterfoil(counterfoilNo);
        if (res.data.success) {
          showToast("Counterfoil no found", "success");
          const receipt = res.data.data;
          setValue("totalAmount", receipt.rupeesInCash);
          setValue("amountInWords", rupeesToWords(receipt.rupeesInCash));
          setValue(
            "counterfoilDate",
            receipt.date ? receipt.date.slice(0, 10) : "",
          );
        }
      } catch (error) {
        setCounterfoilError("Counterfoil no not found");
        setValue("totalAmount", "");
        setValue("amountInWords", "");
        setValue("counterfoilDate", "");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [counterfoilNo, setValue]);

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

  useEffect(() => {
    if (!totalAmount) return;
    const raw = totalAmount.replace(/,/g, "");
    setValue("totalAmount", formatIndianNumber(raw), { shouldValidate: true });
    setValue("amountInWords", rupeesToWords(raw), { shouldValidate: true });
  }, [totalAmount, setValue]);

  // ─── Auto Challan Number ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchNextChallanNo = async () => {
      setIsChallanLoading(true);
      try {
        const res = await getGeneratedChallanNo("COUNCIL");
        setValue("challanNo", res.data.challanNo, {
          shouldDirty: false,
          shouldValidate: false,
        });
      } catch (error) {
        console.error("Failed to fetch challan number", error);
        setValue("challanNo", "ERROR");
      } finally {
        setIsChallanLoading(false);
      }
    };
    fetchNextChallanNo();
  }, [setValue]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const payload = {
      counterfoilNo: data.counterfoilNo,
      counterfoilDate: data.counterfoilDate,
      challanNo: data.challanNo,
      challanDate: data.challanDate,
      challanType: data.challanType.toUpperCase(),
      departmentId: Number(data.department),
      divisionId: Number(data.divisionCode),
      ddoId: Number(data.ddo),
      majorHead: data.majorHead,
      subMajorHead: data.subMajorHead,
      subSubMajorHead: data.subSubMajorHead,
      minorHead: data.minorHead,
      detailHead: data.detailHead,
      treasuryCode: data.treasuryName,
      treasuryChallanNo: data.treasuryChallanNo,
      treasuryChallanDate: data.treasuryChallanDate,
      amount: data.totalAmount.replace(/,/g, ""),
      remarks: data.remarks,
    };
    // console.log("Payload:", payload);

    try {
      if (isEditMode) {
        await updateChallan(id, payload);
        showToast("Challan Updated Successfully!", "success");
        navigate("generated-challan");
      } else {
        await createChallan(payload);
        showToast("Challan created successfully!", "success");
        reset();
      }
    } catch (error) {
      showToast("Something went wrong", "error");
    }
  };

  // ─── Helper: Resolve display label from raw code ───────────────────────────
  const getHeadLabel = (type, code) => {
    if (!code || !heads.length) return code || "—";
    const found = heads.find((h) => {
      if (type === "major") return h.majorHeadCode === code;
      if (type === "subMajor") return h.subMajorCode === code;
      if (type === "subSubMajor") return h.subSubMajorCode === code;
      if (type === "minor") return h.minorHeadCode === code;
      if (type === "detail") return h.detailHeadCode === code;
      return false;
    });
    if (!found) return code;
    if (type === "major") return `${found.majorHead} (${found.majorHeadCode})`;
    if (type === "subMajor") return `${found.subMajor} (${found.subMajorCode})`;
    if (type === "subSubMajor")
      return `${found.subSubMajor || "Null"} (${found.subSubMajorCode || "00"})`;
    if (type === "minor") return `${found.minorHead} (${found.minorHeadCode})`;
    if (type === "detail")
      return `${found.detailHead || "Null"} (${found.detailHeadCode || "00"})`;
    return code;
  };

  const getTreasuryLabel = (code) => {
    const map = { council: "01-Council", css: "02-CSS" };
    return map[code] || code || "—";
  };

  // HEAD FIELDS ARE LOCKED as plain text in edit mode until user changes Major Head
  const headFieldsLocked = isEditMode && !headFieldsUnlocked;

  const handleMajorHeadChange = (e) => {
    // Unlock all cascading dropdowns
    majorHeadChangedByUser.current = true;
    setHeadFieldsUnlocked(true); // triggers re-render so locked → unlocked
    setValue("majorHead", e.target.value);
  };

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      <div className="border-b border-zinc-400 leading-9">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Challan", path: "/challan" },
            {
              label: isEditMode ? "Edit Challan" : "Create Challan",
              path: "/challan",
            },
          ]}
        />
        <h1 className="font-unbounded">
          {isEditMode ? "Edit Challan" : "Fill Challan Details :"}
        </h1>
      </div>

      <FormWrapper
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}>
        <div>
          <InputField
            label="Counterfoil No."
            helperText="(in case of receipt in cash by the Cashier)"
            name="counterfoilNo"
            register={register}
            {...register("counterfoilNo")}
          />
          {counterfoilError && (
            <p className="text-red-500 text-sm mt-1">{counterfoilError}</p>
          )}
        </div>

        <DateField
          label="Counterfoil Date"
          name="counterfoilDate"
          register={register}
          readonly={true}
          {...register("counterfoilDate")}
        />

        <InputField
          label="Challan No."
          readonly={true}
          helperText="( Auto-generated by system )"
          name="challanNo"
          register={register}
          placeholder={isChallanLoading ? "fetching..." : ""}
          {...register("challanNo")}
        />

        <DateField
          label="Challan Date"
          name="challanDate"
          register={register}
          {...register("challanDate")}
        />

        <SelectField
          label="Type"
          name="challanType"
          register={register}
          removable
          options={[{ label: "01-Council", value: "COUNCIL" }]}
          {...register("challanType")}
        />

        <SelectField
          label="Department"
          name="department"
          register={register}
          options={departments}
          disabled={isDepartmentLoading}
          {...register("department")}
        />

        <SelectField
          label="Division Code"
          name="divisionCode"
          register={register}
          options={divisionOptions}
          disabled={isDivisionLoading}
          {...register("divisionCode")}
        />

        <SelectField
          label="DDO"
          name="ddo"
          register={register}
          removable
          options={ddos}
          disabled={isDdoLoading}
          {...register("ddo")}
        />

        {/* ── Major Head: always a real dropdown, but onChange unlocks the rest ── */}
        <SelectField
          label="Major Head"
          name="majorHead"
          register={register}
          options={majorOptions}
          {...register("majorHead", { onChange: handleMajorHeadChange })}
        />

        {/* ── Sub Major Head ── */}
        {headFieldsLocked && editLabels ? (
          <InputField
            label="Sub Major Head"
            name="subMajorHead"
            register={register}
            readonly={true}
            defaultValue={getHeadLabel("subMajor", editLabels.subMajorHead)}
            {...register("subMajorHead")}
          />
        ) : (
          <SelectField
            label="Sub Major Head"
            name="subMajorHead"
            register={register}
            options={subMajorOptions}
            {...register("subMajorHead")}
          />
        )}

        {/* ── Sub Sub Major Head ── */}
        {headFieldsLocked && editLabels ? (
          <InputField
            label="Sub Sub Major Head"
            name="subSubMajorHead"
            register={register}
            readonly={true}
            defaultValue={getHeadLabel(
              "subSubMajor",
              editLabels.subSubMajorHead,
            )}
            {...register("subSubMajorHead")}
          />
        ) : (
          <SelectField
            label="Sub Sub Major Head"
            name="subSubMajorHead"
            register={register}
            options={subSubMajorOptions}
            {...register("subSubMajorHead")}
          />
        )}

        {/* ── Minor Head ── */}
        {headFieldsLocked && editLabels ? (
          <InputField
            label="Minor Head"
            name="minorHead"
            register={register}
            readonly={true}
            defaultValue={getHeadLabel("minor", editLabels.minorHead)}
            {...register("minorHead")}
          />
        ) : (
          <SelectField
            label="Minor Head"
            name="minorHead"
            register={register}
            options={minorOptions}
            {...register("minorHead")}
          />
        )}

        {/* ── Detail Head ── */}
        {headFieldsLocked && editLabels ? (
          <InputField
            label="Detail Head"
            name="detailHead"
            register={register}
            readonly={true}
            defaultValue={getHeadLabel("detail", editLabels.detailHead)}
            {...register("detailHead")}
          />
        ) : (
          <SelectField
            label="Detail Head"
            name="detailHead"
            register={register}
            options={detailOptions}
            {...register("detailHead")}
          />
        )}

        {/* ── Treasury Name ── */}
        {headFieldsLocked && editLabels ? (
          <InputField
            label="Treasury Name"
            name="treasuryName"
            register={register}
            readonly={true}
            defaultValue={getTreasuryLabel(editLabels.treasuryCode)}
            {...register("treasuryName")}
          />
        ) : (
          <SelectField
            label="Treasury Name"
            name="treasuryName"
            register={register}
            removable
            options={[{ label: "01-Diphu", value: "Diphu" }]}
            {...register("treasuryName")}
          />
        )}

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

        <InputField
          label="Total Amount"
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

        <TextAreaField label="Remarks" name="remarks" register={register} />
      </FormWrapper>
    </div>
  );
};

export default Challan;
