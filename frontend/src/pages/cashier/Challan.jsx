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

// ─── Standalone readonly display input (NOT registered with RHF) ──────────────
// Used to show pre-filled head labels in edit mode without RHF interference.
const LockedInput = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">{label}</label>
    <input
      type="text"
      readOnly
      tabIndex={-1}
      value={value || "—"}
      className="border border-zinc-400 rounded outline-none px-3 py-2 w-full bg-zinc-50 text-zinc-600 cursor-default"
    />
  </div>
);

const Challan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isChallanLoading, setIsChallanLoading] = useState(true);
  const [counterfoilError, setCounterfoilError] = useState("");
  const [heads, setHeads] = useState([]);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(!isEditMode);

  const [majorOptions, setMajorOptions] = useState([]);
  const [subMajorOptions, setSubMajorOptions] = useState([]);
  const [subSubMajorOptions, setSubSubMajorOptions] = useState([]);
  const [minorOptions, setMinorOptions] = useState([]);
  const [detailOptions, setDetailOptions] = useState([]);

  // Tracks if the user has manually changed Major Head while in edit mode.
  const majorHeadChangedByUser = useRef(false);
  const [headFieldsUnlocked, setHeadFieldsUnlocked] = useState(false);

  // Tracks whether the selectedMajor effect is running for the first time
  const isFirstMajorRender = useRef(true);

  // Raw DB codes stored separately so LockedInput can show labels
  // even before `heads` is loaded (falls back to raw code, then label once loaded)
  const [editCodes, setEditCodes] = useState({
    subMajorHead: "",
    subSubMajorHead: "",
    minorHead: "",
    detailHead: "",
    treasuryName: "",
  });

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
    control,
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

  // ─── Watch fields needed for cascade and for locked-input labels ───────────
  const selectedMajor = watch("majorHead");
  const selectedSubMajor = watch("subMajorHead");
  const selectedSubSubMajor = watch("subSubMajorHead");
  const selectedMinor = watch("minorHead");

  // ─── Fetch Challan for Edit ────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;

    const fetchChallan = async () => {
      try {
        const res = await getChallanById(id);
        if (res.data.success) {
          const data = res.data.data;

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
          setValue("department", String(data.departmentId));
          setValue("divisionCode", String(data.divisionId));
          setValue("ddo", String(data.ddoId));
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

          // Set head codes into RHF (needed for submit payload)
          setValue("majorHead", String(data.majorHead || ""));
          setValue("subMajorHead", String(data.subMajorHead || ""));
          setValue("subSubMajorHead", String(data.subSubMajorHead || ""));
          setValue("minorHead", String(data.minorHead || ""));
          setValue("detailHead", String(data.detailHead || ""));
          setValue("treasuryName", String(data.treasuryCode || ""));

          // Also store raw codes separately so LockedInputs can display labels
          setEditCodes({
            subMajorHead: String(data.subMajorHead || ""),
            subSubMajorHead: String(data.subSubMajorHead || ""),
            minorHead: String(data.minorHead || ""),
            detailHead: String(data.detailHead || ""),
            treasuryName: String(data.treasuryCode || ""),
          });

          setTimeout(() => {
            setIsInitialDataLoaded(true);
          }, 100);
        }
      } catch (error) {
        showToast("Failed to fetch challan", "error");
      }
    };

    fetchChallan();
  }, [id, isEditMode, setValue]);

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
                String(h.majorHeadCode),
                {
                  label: `${h.majorHead} (${h.majorHeadCode})`,
                  value: String(h.majorHeadCode),
                },
              ]),
          ).values(),
        ];
        setMajorOptions(majors);
      }
    };
    fetchHeads();
  }, []);

  // ─── Detect user-driven Major Head change (skip first render) ─────────────
  useEffect(() => {
    if (isFirstMajorRender.current) {
      isFirstMajorRender.current = false;
      return;
    }
    // Only unlock if in edit mode and user actually changed it
    if (isEditMode) {
      majorHeadChangedByUser.current = true;
      setHeadFieldsUnlocked(true);
    }
  }, [selectedMajor, isEditMode]);

  // ─── Sub Major Options (cascade from Major) ────────────────────────────────
  useEffect(() => {
    if (!selectedMajor || !isInitialDataLoaded) {
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
              String(h.subMajorParentCode) === String(selectedMajor),
          )
          .map((h) => [
            String(h.subMajorCode),
            {
              label: `${h.subMajor} (${h.subMajorCode})`,
              value: String(h.subMajorCode),
            },
          ]),
      ).values(),
    ];
    setSubMajorOptions(subs);

    if (majorHeadChangedByUser.current) {
      setValue("subMajorHead", "", { shouldDirty: false });
      setValue("subSubMajorHead", "", { shouldDirty: false });
      setValue("minorHead", "", { shouldDirty: false });
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [selectedMajor, heads, isInitialDataLoaded, setValue]);

  // ─── Sub Sub Major Options ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSubMajor || !isInitialDataLoaded) {
      setSubSubMajorOptions([]);
      return;
    }

    const subSubs = [
      ...new Map(
        heads
          .filter(
            (h) => String(h.subSubMajorParentCode) === String(selectedSubMajor),
          )
          .map((h) => [
            String(h.subSubMajorCode || "00"),
            {
              label: `${h.subSubMajor || "Null"} (${h.subSubMajorCode || "00"})`,
              value: String(h.subSubMajorCode || "00"),
            },
          ]),
      ).values(),
    ];
    setSubSubMajorOptions(subSubs);

    if (majorHeadChangedByUser.current) {
      setValue("subSubMajorHead", "", { shouldDirty: false });
      setValue("minorHead", "", { shouldDirty: false });
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [selectedSubMajor, heads, isInitialDataLoaded, setValue]);

  // ─── Minor Options ─────────────────────────────────────────────────────────
  useEffect(() => {
    const parentCode =
      selectedSubSubMajor && selectedSubSubMajor !== "0"
        ? selectedSubSubMajor
        : selectedSubMajor;

    if (!parentCode || !isInitialDataLoaded) {
      setMinorOptions([]);
      return;
    }

    const minors = [
      ...new Map(
        heads
          .filter((h) => String(h.minorHeadParentCode) === String(parentCode))
          .map((h) => {
            const code =
              h.minorHeadCode && h.minorHeadCode !== "0"
                ? String(h.minorHeadCode)
                : "0";
            const name =
              h.minorHead && h.minorHead.trim() !== "" ? h.minorHead : "Null";
            return [code, { label: `${name} (${code})`, value: code }];
          }),
      ).values(),
    ];

    if (minors.length === 0) {
      minors.push({ label: "Null (0)", value: "0" });
    }

    setMinorOptions(minors);

    if (majorHeadChangedByUser.current) {
      setValue("minorHead", "", { shouldDirty: false });
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [
    selectedSubSubMajor,
    selectedSubMajor,
    heads,
    isInitialDataLoaded,
    setValue,
  ]);

  // ─── Detail Options ────────────────────────────────────────────────────────
  useEffect(() => {
    const parentCode =
      selectedMinor && selectedMinor !== ""
        ? selectedMinor
        : selectedSubSubMajor && selectedSubSubMajor !== "0"
          ? selectedSubSubMajor
          : selectedSubMajor;

    if (!parentCode || !isInitialDataLoaded) {
      setDetailOptions([]);
      return;
    }

    const details = [
      ...new Map(
        heads
          .filter((h) => String(h.detailHeadParentCode) === String(parentCode))
          .map((h) => {
            const code = String(
              h.detailHeadCode && h.detailHeadCode !== "0"
                ? h.detailHeadCode
                : "00",
            );
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
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [
    selectedMinor,
    selectedSubSubMajor,
    selectedSubMajor,
    heads,
    isInitialDataLoaded,
    setValue,
  ]);

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
    if (isEditMode) return;
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
  }, [setValue, isEditMode]);

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

    try {
      if (isEditMode) {
        await updateChallan(id, payload);
        showToast("Challan Updated Successfully!", "success");
        navigate("/");
      } else {
        await createChallan(payload);
        showToast("Challan created successfully!", "success");
        reset();
      }
    } catch (error) {
      showToast("Something went wrong", "error");
    }
  };

  // ─── Resolve display label from raw code (for LockedInput) ────────────────
  const getHeadLabel = (type, code) => {
    if (!code || !heads.length) return code || "—";
    const found = heads.find((h) => {
      if (type === "major") return String(h.majorHeadCode) === String(code);
      if (type === "subMajor") return String(h.subMajorCode) === String(code);
      if (type === "subSubMajor")
        return String(h.subSubMajorCode) === String(code);
      if (type === "minor") return String(h.minorHeadCode) === String(code);
      if (type === "detail") return String(h.detailHeadCode) === String(code);
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
    const map = { council: "01-Council", css: "02-CSS", Diphu: "01-Diphu" };
    return map[code] || code || "—";
  };

  // true  → show LockedInput (readonly display, not RHF-connected)
  // false → show SelectField (fully functional dropdown)
  const headFieldsLocked = isEditMode && !headFieldsUnlocked;

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
        {/* ── Counterfoil No ── */}
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

        {/* ── Counterfoil Date ── */}
        <DateField
          label="Counterfoil Date"
          name="counterfoilDate"
          register={register}
          readonly={true}
          {...register("counterfoilDate")}
        />

        {/* ── Challan No ── */}
        <InputField
          label="Challan No."
          readonly={true}
          helperText="( Auto-generated by system )"
          name="challanNo"
          register={register}
          placeholder={isChallanLoading ? "fetching..." : ""}
          {...register("challanNo")}
        />

        {/* ── Challan Date ── */}
        <DateField
          label="Challan Date"
          name="challanDate"
          register={register}
          {...register("challanDate")}
        />

        {/* ── Type ── */}
        <SelectField
          label="Type"
          name="challanType"
          control={control}
          removable
          options={[{ label: "01-Council", value: "COUNCIL" }]}
        />

        {/* ── Department ── */}
        <SelectField
          label="Department"
          name="department"
          control={control}
          options={departments}
          disabled={isDepartmentLoading}
        />

        {/* ── Division Code ── */}
        <SelectField
          label="Division Code"
          name="divisionCode"
          control={control}
          options={divisionOptions}
          disabled={isDivisionLoading}
        />

        {/* ── DDO ── */}
        <SelectField
          label="DDO"
          name="ddo"
          control={control}
          removable
          options={ddos}
          disabled={isDdoLoading}
        />

        {/* ── Major Head — always a real dropdown (changing it unlocks the rest) ── */}
        <SelectField
          label="Major Head"
          name="majorHead"
          control={control}
          options={majorOptions}
        />

        {/* ── Sub Major Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Sub Major Head"
            value={getHeadLabel("subMajor", editCodes.subMajorHead)}
          />
        ) : (
          <SelectField
            label="Sub Major Head"
            name="subMajorHead"
            control={control}
            options={subMajorOptions}
          />
        )}

        {/* ── Sub Sub Major Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Sub Sub Major Head"
            value={getHeadLabel("subSubMajor", editCodes.subSubMajorHead)}
          />
        ) : (
          <SelectField
            label="Sub Sub Major Head"
            name="subSubMajorHead"
            control={control}
            options={subSubMajorOptions}
          />
        )}

        {/* ── Minor Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Minor Head"
            value={getHeadLabel("minor", editCodes.minorHead)}
          />
        ) : (
          <SelectField
            label="Minor Head"
            name="minorHead"
            control={control}
            options={minorOptions}
          />
        )}

        {/* ── Detail Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Detail Head"
            value={getHeadLabel("detail", editCodes.detailHead)}
          />
        ) : (
          <SelectField
            label="Detail Head"
            name="detailHead"
            control={control}
            options={detailOptions}
          />
        )}

        {/* ── Treasury Name ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Treasury Name"
            value={getTreasuryLabel(editCodes.treasuryName)}
          />
        ) : (
          <SelectField
            label="Treasury Name"
            name="treasuryName"
            control={control}
            removable
            options={[{ label: "01-Diphu", value: "Diphu" }]}
          />
        )}

        {/* ── Treasury Challan No ── */}
        <InputField
          label="Treasury Challan No"
          name="treasuryChallanNo"
          register={register}
          {...register("treasuryChallanNo")}
        />

        {/* ── Treasury Challan Date ── */}
        <DateField
          label="Treasury Challan Date"
          name="treasuryChallanDate"
          register={register}
          {...register("treasuryChallanDate")}
        />

        {/* ── Total Amount ── */}
        <InputField
          label="Total Amount"
          name="totalAmount"
          register={register}
          {...register("totalAmount")}
        />

        {/* ── Amount In Words ── */}
        <InputField
          label="Amount In Words"
          name="amountInWords"
          register={register}
          readonly={true}
          {...register("amountInWords")}
        />

        {/* ── Remarks ── */}
        <TextAreaField label="Remarks" name="remarks" register={register} />
      </FormWrapper>
    </div>
  );
};

export default Challan;
