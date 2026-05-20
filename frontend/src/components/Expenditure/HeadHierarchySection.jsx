import SelectField from "../Forms/SelectField";
import InputField from "../Forms/InputField";

const HeadHierarchySection = ({
  register,
  control, // ✅ ADD control parameter
  loading = false,
  isEditMode = false,

  majorHeads = [],
  subMajors = [],
  minors = [],
  subHeads = [],
  subSubHeads = [],
  detailHeads = [],
  subDetailHeads = [],
}) => {
  // ✅ In edit mode, render plain text inputs (no API fetches needed)
  if (isEditMode) {
    return (
      <>
        <InputField label="Major Head" name="majorHead" register={register} />
        <InputField
          label="Sub Major Head"
          name="subMajorHead"
          register={register}
        />
        <InputField label="Minor Head" name="minorHead" register={register} />
        <InputField label="Sub Head" name="subHead" register={register} />
        <InputField
          label="Sub Sub Head"
          name="subSubHead"
          register={register}
        />
        <InputField label="Detail Head" name="detailHead" register={register} />
        <InputField
          label="Sub Detail Head"
          name="subDetailHead"
          register={register}
        />
      </>
    );
  }

  // ✅ In create mode, render cascading dropdowns with control (not register)
  return (
    <>
      <SelectField
        label="Major Head"
        name="majorHead"
        control={control}
        options={[{ label: "Select Major Head", value: "" }, ...majorHeads]}
        loading={loading}
      />

      <SelectField
        label="Sub Major Head"
        name="subMajorHead"
        control={control}
        options={[{ label: "Select Sub Major Head", value: "" }, ...subMajors]}
      />

      <SelectField
        label="Minor Head"
        name="minorHead"
        control={control}
        options={[{ label: "Select Minor Head", value: "" }, ...minors]}
      />

      <SelectField
        label="Sub Head"
        name="subHead"
        control={control}
        options={[{ label: "Select Sub Head", value: "" }, ...subHeads]}
      />

      <SelectField
        label="Sub Sub Head"
        name="subSubHead"
        control={control}
        options={[{ label: "Select Sub Sub Head", value: "" }, ...subSubHeads]}
      />

      <SelectField
        label="Detail Head"
        name="detailHead"
        control={control}
        options={[{ label: "Select Detail Head", value: "" }, ...detailHeads]}
      />

      <SelectField
        label="Sub Detail Head"
        name="subDetailHead"
        control={control}
        options={[
          { label: "Select Sub Detail Head", value: "" },
          ...subDetailHeads,
        ]}
      />
    </>
  );
};

export default HeadHierarchySection;
