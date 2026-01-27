import { useState } from "react";
import FormWrapper from "../../components/Forms/FormWrapper";
import InputField from "../../components/Forms/InputField";
import SelectField from "../../components/Forms/SelectField";
import TextAreaField from "../../components/Forms/TextAreaField";
import DateField from "../../components/Forms/DateField";
import { rupeesToWords } from "../../utils/rupeesToWords";
import { formatIndianNumber } from "../../utils/formatIndianCurrency";
import Breadcrumbs from "../../components/ui/Breadcrumbs";

const StateChallan = () => {
  const [form, setForm] = useState({
    challanNo: "",
    department: "",
    paymentMode: "",
    remarks: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "totalAmount") {
      const rawValue = value.replace(/,/g, "");

      setForm((prev) => ({
        ...prev,
        totalAmount: formatIndianNumber(rawValue),
        amountInWords: rupeesToWords(rawValue),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="min-h-screen w-full px-5 py-3 pb-6">
      <div className="border-b border-zinc-400 leading-9">
        <Breadcrumbs
          items={[
            { label: "Dashboard", path: "/" },
            { label: "Challan", path: "/challan" },
            { label: "Create State Challan", path: "/challan" },
          ]}
        />

        <h1 className="font-unbounded">Fill Challan Details :</h1>
      </div>

      <FormWrapper onSubmit={(e) => e.preventDefault()}>
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

        <InputField
          label="No."
          name="stateNo"
          value={form.stateNo}
          onChange={handleChange}
        />

        <InputField
          label="From"
          name="from"
          value={form.from}
          onChange={handleChange}
        />

        <InputField
          label="To"
          name="to"
          value={form.to}
          onChange={handleChange}
        />

        <InputField
          label="Subject"
          name="subject"
          value={form.subject}
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

export default StateChallan;
