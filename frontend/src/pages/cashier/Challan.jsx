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

  // ── Key that increments after each successful create, triggering a fresh challan-no fetch ──
  const [challanFetchKey, setChallanFetchKey] = useState(0);

  const [isChallanLoading, setIsChallanLoading] = useState(true);
  const [counterfoilError, setCounterfoilError] = useState("");
  const [heads, setHeads] = useState([]);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(!isEditMode);

  const [majorOptions, setMajorOptions] = useState([]);
  const [subMajorOptions, setSubMajorOptions] = useState([]);
  const [minorOptions, setMinorOptions] = useState([]);
  const [subHeadOptions, setSubHeadOptions] = useState([]);
  const [subSubHeadOptions, setSubSubHeadOptions] = useState([]);
  const [detailOptions, setDetailOptions] = useState([]);

  const majorHeadChangedByUser = useRef(false);
  const [headFieldsUnlocked, setHeadFieldsUnlocked] = useState(false);
  const isFirstMajorRender = useRef(true);

  const [editCodes, setEditCodes] = useState({
    subMajorCode: "",
    minorHeadCode: "",
    subHeadCode: "",
    subSubHeadCode: "",
    detailHeadCode: "",
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
    formState: { isSubmitting, errors },
  } = useForm({
    defaultValues: {
      challanType: "",
      department: "",
      divisionCode: "",
      ddo: "",
      majorHead: "",
      subMajorHead: "",
      minorHead: "",
      subHead: "",
      subSubHead: "",
      detailHead: "",
      treasuryName: "",
      treasuryChallanNo: "",
      treasuryChallanDate: "",
      totalAmount: "",
      amountInWords: "",
      remarks: "",
    },
  });

  const selectedMajor = watch("majorHead");
  const selectedSubMajor = watch("subMajorHead");
  const selectedMinor = watch("minorHead");
  const selectedSubHead = watch("subHead");
  const selectedSubSub = watch("subSubHead");

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

          setValue("majorHead", String(data.majorHead || ""));
          setValue("subMajorHead", String(data.subMajorHead || ""));
          setValue("minorHead", String(data.minorHead || ""));
          setValue("subHead", String(data.subHead || ""));
          setValue("subSubHead", String(data.subSubHead || ""));
          setValue("detailHead", String(data.detailHead || ""));
          setValue("treasuryName", String(data.treasuryCode || ""));

          setEditCodes({
            subMajorCode: String(data.subMajorHead || ""),
            minorHeadCode: String(data.minorHead || ""),
            subHeadCode: String(data.subHead || ""),
            subSubHeadCode: String(data.subSubHead || ""),
            detailHeadCode: String(data.detailHead || ""),
            treasuryName: String(data.treasuryCode || ""),
          });

          setTimeout(() => setIsInitialDataLoaded(true), 100);
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

  // ─── Detect user-driven Major Head change ─────────────────────────────────
  useEffect(() => {
    if (isFirstMajorRender.current) {
      isFirstMajorRender.current = false;
      return;
    }
    if (isEditMode) {
      majorHeadChangedByUser.current = true;
      setHeadFieldsUnlocked(true);
    }
  }, [selectedMajor, isEditMode]);

  // ─── Level 2: Sub Major Head ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedMajor || !isInitialDataLoaded) {
      setSubMajorOptions([]);
      return;
    }

    const opts = [
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
    setSubMajorOptions(opts);

    if (majorHeadChangedByUser.current) {
      setValue("subMajorHead", "", { shouldDirty: false });
      setValue("minorHead", "", { shouldDirty: false });
      setValue("subHead", "", { shouldDirty: false });
      setValue("subSubHead", "", { shouldDirty: false });
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [selectedMajor, heads, isInitialDataLoaded, setValue]);

  // ─── Level 3: Minor Head ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSubMajor || !isInitialDataLoaded) {
      setMinorOptions([]);
      return;
    }

    const opts = [
      ...new Map(
        heads
          .filter(
            (h) =>
              h.minorHeadCode &&
              h.minorHeadCode !== "0" &&
              String(h.minorHeadParentCode) === String(selectedSubMajor),
          )
          .map((h) => [
            String(h.minorHeadCode),
            {
              label: `${h.minorHead} (${h.minorHeadCode})`,
              value: String(h.minorHeadCode),
            },
          ]),
      ).values(),
    ];
    setMinorOptions(opts);

    if (majorHeadChangedByUser.current) {
      setValue("minorHead", "", { shouldDirty: false });
      setValue("subHead", "", { shouldDirty: false });
      setValue("subSubHead", "", { shouldDirty: false });
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [selectedSubMajor, heads, isInitialDataLoaded, setValue]);

  // ─── Level 4: Sub Head ────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedMinor || !isInitialDataLoaded) {
      setSubHeadOptions([]);
      return;
    }

    const opts = [
      ...new Map(
        heads
          .filter(
            (h) =>
              h.subHeadCode &&
              h.subHeadCode !== "0" &&
              String(h.subHeadParentCode) === String(selectedMinor),
          )
          .map((h) => [
            String(h.subHeadCode),
            {
              label: `${h.subHead} (${h.subHeadCode})`,
              value: String(h.subHeadCode),
            },
          ]),
      ).values(),
    ];

    if (opts.length === 0) opts.push({ label: "Null (0)", value: "0" });
    setSubHeadOptions(opts);

    if (majorHeadChangedByUser.current) {
      setValue("subHead", "", { shouldDirty: false });
      setValue("subSubHead", "", { shouldDirty: false });
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [selectedMinor, heads, isInitialDataLoaded, setValue]);

  // ─── Level 5: Sub Sub Head ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSubHead || !isInitialDataLoaded) {
      setSubSubHeadOptions([]);
      return;
    }

    const opts = [
      ...new Map(
        heads
          .filter(
            (h) =>
              h.subSubHeadCode &&
              h.subSubHeadCode !== "0" &&
              String(h.subSubHeadParentCode) === String(selectedSubHead),
          )
          .map((h) => [
            String(h.subSubHeadCode),
            {
              label: `${h.subSubHead} (${h.subSubHeadCode})`,
              value: String(h.subSubHeadCode),
            },
          ]),
      ).values(),
    ];

    if (opts.length === 0) opts.push({ label: "Null (0)", value: "0" });
    setSubSubHeadOptions(opts);

    if (majorHeadChangedByUser.current) {
      setValue("subSubHead", "", { shouldDirty: false });
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [selectedSubHead, heads, isInitialDataLoaded, setValue]);

  // ─── Level 6: Detail Head ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSubSub || !isInitialDataLoaded) {
      setDetailOptions([]);
      return;
    }

    const opts = [
      ...new Map(
        heads
          .filter(
            (h) =>
              h.detailHeadCode &&
              h.detailHeadCode !== "0" &&
              String(h.detailHeadParentCode) === String(selectedSubSub),
          )
          .map((h) => [
            String(h.detailHeadCode),
            {
              label: `${h.detailHead} (${h.detailHeadCode})`,
              value: String(h.detailHeadCode),
            },
          ]),
      ).values(),
    ];

    if (opts.length === 0) opts.push({ label: "Null (0)", value: "0" });
    setDetailOptions(opts);

    if (majorHeadChangedByUser.current) {
      setValue("detailHead", "", { shouldDirty: false });
    }
  }, [selectedSubSub, heads, isInitialDataLoaded, setValue]);

  // ─── Counterfoil Lookup ────────────────────────────────────────────────────
  const totalAmount = watch("totalAmount");
  const counterfoilNo = watch("counterfoilNo");

  useEffect(() => {
    if (!counterfoilNo) {
      setCounterfoilError("");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getCashReceiptByCounterfoil(counterfoilNo);
        if (res.data.success) {
          showToast("Counterfoil no found", "success");
          setCounterfoilError("");
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
  // Re-runs whenever challanFetchKey increments (i.e. after every successful create)
  useEffect(() => {
    if (isEditMode) return;
    const fetchNextChallanNo = async () => {
      setIsChallanLoading(true);
      // Clear the field first so the user sees "fetching..." while waiting
      setValue("challanNo", "", { shouldDirty: false, shouldValidate: false });
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
  }, [setValue, isEditMode, challanFetchKey]); // <-- challanFetchKey added here

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
      minorHead: data.minorHead,
      subHead: data.subHead,
      subSubHead: data.subSubHead,
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
        // Reset the form first, then bump the key to trigger a fresh challan-no fetch
        reset();
        setChallanFetchKey((prev) => prev + 1);
      }
    } catch (error) {
      showToast("Something went wrong", "error");
    }
  };

  // ─── Resolve human-readable label from raw code ───────────────────────────
  const getHeadLabel = (level, code) => {
    if (!code || !heads.length) return code || "—";
    const found = heads.find((h) => {
      if (level === "subMajor") return String(h.subMajorCode) === String(code);
      if (level === "minor") return String(h.minorHeadCode) === String(code);
      if (level === "subHead") return String(h.subHeadCode) === String(code);
      if (level === "subSub") return String(h.subSubHeadCode) === String(code);
      if (level === "detail") return String(h.detailHeadCode) === String(code);
      return false;
    });
    if (!found) return code;
    if (level === "subMajor")
      return `${found.subMajor}  (${found.subMajorCode})`;
    if (level === "minor") return `${found.minorHead} (${found.minorHeadCode})`;
    if (level === "subHead") return `${found.subHead}   (${found.subHeadCode})`;
    if (level === "subSub")
      return `${found.subSubHead}(${found.subSubHeadCode})`;
    if (level === "detail")
      return `${found.detailHead}(${found.detailHeadCode})`;
    return code;
  };

  const getTreasuryLabel = (code) => {
    const map = { council: "01-Council", css: "02-CSS", Diphu: "01-Diphu" };
    return map[code] || code || "—";
  };

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
        <div className="flex flex-col gap-1">
          <InputField
            label="Challan No."
            readonly={true}
            helperText="( Auto-generated by system )"
            name="challanNo"
            register={register}
            placeholder={isChallanLoading ? "fetching..." : ""}
            {...register("challanNo", {
              required: "Challan No. is required. Please wait for it to load.",
            })}
          />
          {errors.challanNo && (
            <p className="text-red-500 text-sm mt-1">
              {errors.challanNo.message}
            </p>
          )}
        </div>

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

        {/* ── Level 1: Major Head ── */}
        <SelectField
          label="Major Head"
          name="majorHead"
          control={control}
          options={majorOptions}
        />

        {/* ── Level 2: Sub Major Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Sub Major Head"
            value={getHeadLabel("subMajor", editCodes.subMajorCode)}
          />
        ) : (
          <SelectField
            label="Sub Major Head"
            name="subMajorHead"
            control={control}
            options={subMajorOptions}
          />
        )}

        {/* ── Level 3: Minor Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Minor Head"
            value={getHeadLabel("minor", editCodes.minorHeadCode)}
          />
        ) : (
          <SelectField
            label="Minor Head"
            name="minorHead"
            control={control}
            options={minorOptions}
          />
        )}

        {/* ── Level 4: Sub Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Sub Head"
            value={getHeadLabel("subHead", editCodes.subHeadCode)}
          />
        ) : (
          <SelectField
            label="Sub Head"
            name="subHead"
            control={control}
            options={subHeadOptions}
          />
        )}

        {/* ── Level 5: Sub Sub Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Sub Sub Head"
            value={getHeadLabel("subSub", editCodes.subSubHeadCode)}
          />
        ) : (
          <SelectField
            label="Sub Sub Head"
            name="subSubHead"
            control={control}
            options={subSubHeadOptions}
          />
        )}

        {/* ── Level 6: Detail Head ── */}
        {headFieldsLocked ? (
          <LockedInput
            label="Detail Head"
            value={getHeadLabel("detail", editCodes.detailHeadCode)}
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
            options={[
              { label: "01-Diphu", value: "Diphu" },
              { label: "02-Hamren", value: "Hamren" },
              { label: "03-Bokajan", value: "Bokajan" },
            ]}
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
