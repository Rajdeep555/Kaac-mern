import SelectField from "../Forms/SelectField";
import InputField from "../Forms/InputField";

const HeadHierarchySection = ({
  register,
  loading = false,
  isEditMode = false, // ✅ NEW PROP

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

  // ✅ In create mode, render cascading dropdowns as before
  return (
    <>
      <SelectField
        label="Major Head"
        name="majorHead"
        register={register}
        options={[{ label: "Select Major Head", value: "" }, ...majorHeads]}
        loading={loading}
      />

      <SelectField
        label="Sub Major Head"
        name="subMajorHead"
        register={register}
        options={[{ label: "Select Sub Major Head", value: "" }, ...subMajors]}
      />

      <SelectField
        label="Minor Head"
        name="minorHead"
        register={register}
        options={[{ label: "Select Minor Head", value: "" }, ...minors]}
      />

      <SelectField
        label="Sub Head"
        name="subHead"
        register={register}
        options={[{ label: "Select Sub Head", value: "" }, ...subHeads]}
      />

      <SelectField
        label="Sub Sub Head"
        name="subSubHead"
        register={register}
        options={[{ label: "Select Sub Sub Head", value: "" }, ...subSubHeads]}
      />

      <SelectField
        label="Detail Head"
        name="detailHead"
        register={register}
        options={[{ label: "Select Detail Head", value: "" }, ...detailHeads]}
      />

      <SelectField
        label="Sub Detail Head"
        name="subDetailHead"
        register={register}
        options={[
          { label: "Select Sub Detail Head", value: "" },
          ...subDetailHeads,
        ]}
      />
    </>
  );
};

export default HeadHierarchySection;
