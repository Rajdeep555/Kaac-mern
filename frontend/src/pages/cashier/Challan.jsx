import React, { useState } from "react";
import FormWrapper from "../../components/Forms/FormWrapper";
import InputField from "../../components/Forms/InputField";
import SelectField from "../../components/Forms/SelectField";
import RadioGroup from "../../components/Forms/RadioGroup";
import TextAreaField from "../../components/Forms/TextAreaField";
import DateField from "../../components/Forms/DateField";

const Challan = () => {
  const [form, setForm] = useState({
    challanNo: "",
    department: "",
    paymentMode: "",
    remarks: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      <div className="border-b border-zinc-400 leading-9">
        <h1 className="font-unbounded">Fill Challan Details :</h1>
      </div>

      <FormWrapper onSubmit={(e) => e.preventDefault()}>
        <InputField
          label="Counterfoil No."
          helperText="(in case of receipt in cash by the Cashier)"
          name="counterfoilNo"
          value={form.counterfoilNo}
          onChange={handleChange}
        />

        <DateField
          label="Counterfoil Date"
          name="counterfoilDate"
          value={form.counterfoilDate}
          onChange={handleChange}
          readonly={true}
        />

        <InputField
          label="Challan No."
          name="challanNo"
          value={form.challanNo}
          onChange={handleChange}
        />

        <DateField
          label="Challan Date"
          name="challanDate"
          value={form.challanDate}
          onChange={handleChange}
        />

        <SelectField
          label="Type"
          name="challanType"
          value={form.challanType}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Department"
          name="department"
          value={form.department}
          onChange={handleChange}
          removable
          options={[
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
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="DDO"
          name="ddo"
          value={form.ddo}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Major Head"
          name="majorHead"
          value={form.majorHead}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Sub Major Head"
          name="subMajorHead"
          value={form.subMajorHead}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Sub Sub Major Head"
          name="subSubMajorHead"
          value={form.subSubMajorHead}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Minor Head"
          name="minorHead"
          value={form.minorHead}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Detail Head"
          name="detailHead"
          value={form.detailHead}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <SelectField
          label="Treasury Name"
          name="treasuryName"
          value={form.treasuryName}
          onChange={handleChange}
          removable
          options={[
            { label: "01-Council", value: "council" },
            { label: "02-CSS", value: "css" },
          ]}
        />

        <InputField
          label="Treasury Challan No"
          name="treasuryChallanNo"
          value={form.treasuryChallanNo}
          onChange={handleChange}
        />

        <DateField
          label="Treasury Challan Date"
          name="treasuryChallanDate"
          value={form.treasuryChallanDate}
          onChange={handleChange}
        />

        <InputField
          label="Total Amount"
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

export default Challan;
