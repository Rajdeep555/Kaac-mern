import React from "react";
import { useExpenditure } from "../../hooks/admin/useExpenditure";
import Form3 from "../../../../components/DisplayForms/Form3";

const Form3Council = () => {
  const { expenditures, loading } = useExpenditure({
    sector: "COUNCIL",
    paymentMode: "CHEQUE",
  });

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <Form3
      data={expenditures}
      title="Register of cheque drawn during the month (COUNCIL)"
    />
  );
};

export default Form3Council;
