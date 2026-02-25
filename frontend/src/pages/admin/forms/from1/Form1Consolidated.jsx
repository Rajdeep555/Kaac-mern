// Form1Consolidated.jsx
import React from "react";
import Form1 from "../../../../components/DisplayForms/Form1";

const Form1Consolidated = ({ year = 2024 }) => {
  return <Form1 sector="CONSOLIDATED" year={year} />;
};

export default Form1Consolidated;
