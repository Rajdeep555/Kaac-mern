import { useForm } from "react-hook-form";
import FormWrapper from "../../components/Forms/FormWrapper";
import Breadcrumbs from "../../components/ui/Breadcrumbs";
import InputField from "../../components/Forms/InputField";
import DateField from "../../components/Forms/DateField";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import {
  createCashReceipt,
  getCashReceiptById,
  updateCashReceipt,
} from "../../api/cashReceipt.api.js";
import { showToast } from "../../utils/toast.js";

const CashReceipt = () => {
  // checking while it is edit or create
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const isEditMode = Boolean(id);

  //loading data while editing
  useEffect(() => {
    if (!isEditMode) return;

    const fetchReceipt = async () => {
      try {
        const res = await getCashReceiptById(id);

        if (res.data.success) {
          const data = res.data.data;

          // converting ISO Dates

          reset({
            ...data,
            date: data.date ? data.date.slice(0, 10) : "",
            letterDate: data.letterDate ? data.letterDate.slice(0, 10) : "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch receipt", error);
      }
    };

    fetchReceipt();
  }, [id, isEditMode, reset]);

  //submit
  const onSubmit = async (data) => {
    try {
      if (isEditMode) {
        await updateCashReceipt(id, data);
        showToast("Receipt Updated Successfully!", "success");

        navigate("/generated-cash-receipt", {
          state: { receipt: res.data.data },
        });
      } else {
        await createCashReceipt(data);
        showToast("Receipt Created Successfully!", "success");
        reset();
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

      <FormWrapper onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="Counterfoil No."
          name="counterfoilNo"
          register={register}
          {...register("counterfoilNo")}
        />

        <DateField
          label="Date"
          name="date"
          register={register}
          {...register("date")}
        />

        <InputField
          label="Recevied From"
          name="receivedFrom"
          register={register}
          {...register("receivedFrom")}
        />

        <InputField
          label="Letter No"
          name="letterNo"
          register={register}
          {...register("letterNo")}
        />

        <DateField
          label="Letter Date"
          name="letterDate"
          register={register}
          {...register("letterDate")}
        />

        <InputField
          label="Rupees In Cash"
          name="rupeesInCash"
          register={register}
          {...register("rupeesInCash")}
        />

        <InputField
          label="By Cheque/Bank"
          name="byChequeBank"
          register={register}
          {...register("byChequeBank")}
        />
      </FormWrapper>
    </div>
  );
};

export default CashReceipt;
