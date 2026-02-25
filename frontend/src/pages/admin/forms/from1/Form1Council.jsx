import React from "react";
import Form1 from "../../../../components/DisplayForms/Form1";

const Form1Council = ({ year = 2025 }) => {
  return <Form1 sector="COUNCIL" year={year} />;
};

export default Form1Council;
