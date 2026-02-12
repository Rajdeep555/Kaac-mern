import { useForm } from "react-hook-form";
import FormWrapper from "../../../components/Forms/FormWrapper";
import Breadcrumbs from "../../../components/ui/Breadcrumbs";
import InputField from "../../../components/Forms/InputField";
import DateField from "../../../components/Forms/DateField";


const CashReceipt = () => {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();


  //submit
  const onSubmit = async (data) => {
    console.log("The challan form data:", data)
  }

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      <div className="border-b border-zinc-400 leading-9">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Challan", path: "/challan" },
            { label: "Create Challan", path: "/challan" },
          ]}
        />
        <h1 className="font-unbounded">You Are Adding a New Record:</h1>
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
          name="Date"
          register={register}
          {...register("Date")}
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
          name="byBank"
          register={register}
          {...register("byBank")}
        />

      </FormWrapper>
    </div>
  );

};

export default CashReceipt;
