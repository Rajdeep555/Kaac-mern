import { useForm } from "react-hook-form";
import FormWrapper from "../../components/Forms/FormWrapper";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import InputField from "../../components/Forms/InputField";
import DateField from "../../components/Forms/DateField";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  createCashReceipt,
  getCashReceiptById,
  updateCashReceipt,
} from "../../api/cashReceipt.api.js";
import { getGeneratedCounterfoilNo } from "../../api/counterfoil.api.js";
import { showToast } from "../../utils/toast.js";

// ✅ Cache lives OUTSIDE component — persists across mounts/navigations
const receiptCache = {};

const CashReceipt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFetching, setIsFetching] = useState(false);
  const [isCounterfoilLoading, setIsCounterfoilLoading] = useState(false);
  const hasFetched = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const isEditMode = Boolean(id);

  /* ================= FETCH NEXT COUNTERFOIL NO (CREATE MODE ONLY) ================= */
  useEffect(() => {
    if (isEditMode) return;

    const fetchCounterfoilNo = async () => {
      setIsCounterfoilLoading(true);
      try {
        const res = await getGeneratedCounterfoilNo();
        if (res.data.success) {
          setValue("counterfoilNo", res.data.counterfoilNo, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch counterfoil number", error);
        showToast("Failed to generate counterfoil number", "error");
        setValue("counterfoilNo", "ERROR");
      } finally {
        setIsCounterfoilLoading(false);
      }
    };

    fetchCounterfoilNo();
  }, [isEditMode, setValue]);

  /* ================= LOAD DATA FOR EDIT MODE ================= */
  useEffect(() => {
    if (!isEditMode) return;
    if (hasFetched.current) return;
    hasFetched.current = true;

    const applyData = (data) => {
      reset({
        ...data,
        date: data.date ? data.date.slice(0, 10) : "",
        letterDate: data.letterDate ? data.letterDate.slice(0, 10) : "",
      });
    };

    // ✅ Use cache if available — zero API call
    if (receiptCache[id]) {
      applyData(receiptCache[id]);
      return;
    }

    const fetchReceipt = async () => {
      setIsFetching(true);
      try {
        const res = await getCashReceiptById(id);
        if (res.data.success) {
          const data = res.data.data;
          receiptCache[id] = data;
          applyData(data);
        }
      } catch (error) {
        console.error("Failed to fetch receipt", error);
        showToast("Failed to load receipt data", "error");
      } finally {
        setIsFetching(false);
      }
    };

    fetchReceipt();
  }, [id, isEditMode]);

  /* ================= SUBMIT ================= */
  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        const res = await updateCashReceipt(id, data);
        delete receiptCache[id];
        showToast("Receipt Updated Successfully!", "success");
        navigate("/generated-cash-receipt", {
          state: { receipt: res.data.data },
        });
      } else {
        await createCashReceipt(data);
        showToast("Receipt Created Successfully!", "success");
        reset();
        // ✅ After reset + create, fetch a fresh counterfoil number for next entry
        try {
          setIsCounterfoilLoading(true);
          const res = await getGeneratedCounterfoilNo();
          if (res.data.success) {
            setValue("counterfoilNo", res.data.counterfoilNo, {
              shouldDirty: false,
              shouldValidate: false,
            });
          }
        } catch {
          // non-fatal — user can refresh
        } finally {
          setIsCounterfoilLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to submit receipt", error);
      showToast("Failed to submit receipt", "error");
    }
  };

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      <div className="border-b border-zinc-400 leading-9">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Cash Receipt", path: "/cash-receipt" },
            {
              label: isEditMode ? "Edit Cash Receipt" : "Create Cash Receipt",
            },
          ]}
        />
        <h1 className="font-unbounded">
          {isEditMode ? "Edit Cash Receipt" : "You Are Adding a New Record"}
        </h1>
      </div>

      {/* ✅ Full page loader while fetching edit data */}
      {isFetching ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
          <svg
            className="animate-spin"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none">
            <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="3" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="#0f2744"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm font-medium">Loading receipt data...</span>
        </div>
      ) : (
        <FormWrapper
          onSubmit={handleSubmit(onSubmit)}
          submitText={isEditMode ? "Update" : "Submit"}
          isSubmitting={isSubmitting}>
          <InputField
            label="Counterfoil No."
            name="counterfoilNo"
            register={register}
            required
            readonly
            placeholder={isCounterfoilLoading ? "Generating..." : ""}
            helperText="( Auto generated by system )"
            error={errors.counterfoilNo?.message}
          />

          <DateField
            label="Date"
            name="date"
            register={register}
            required
            error={errors.date?.message}
          />

          <InputField
            label="Received From"
            name="receivedFrom"
            register={register}
            required
            error={errors.receivedFrom?.message}
          />

          <InputField
            label="Letter No"
            name="letterNo"
            register={register}
            required
            error={errors.letterNo?.message}
          />

          <DateField
            label="Letter Date"
            name="letterDate"
            register={register}
            required
            error={errors.letterDate?.message}
          />

          <InputField
            label="Rupees In Cash"
            name="rupeesInCash"
            register={register}
            required
            error={errors.rupeesInCash?.message}
          />

          <InputField
            label="By Cheque/Bank"
            name="byChequeBank"
            register={register}
            required
            error={errors.byChequeBank?.message}
          />
        </FormWrapper>
      )}
    </div>
  );
};

export default CashReceipt;
