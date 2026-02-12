import React from "react";
import { useExpenditure } from "../../hooks/admin/useExpenditure";
import Form3 from "../../../../components/DisplayForms/Form3";

const Form3State = () => {
  const { expenditures, loading } = useExpenditure({
    sector: "STATE",
    paymentMode: "CHEQUE",
  });

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <Form3
      data={expenditures}
      title="Register of cheque drawn during the month (STATE)"
    />
  );
};

export default Form3State;
