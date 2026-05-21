import SelectField from "../Forms/SelectField";

const HeadHierarchySection = ({
  control,
  loading = false,
  majorHeads = [],
  subMajors = [],
  minors = [],
  subHeads = [],
  subSubHeads = [],
  detailHeads = [],
  subDetailHeads = [],
}) => {
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
