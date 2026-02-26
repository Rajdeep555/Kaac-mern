// Form1State.jsx
import React from "react";
import Form1 from "../../../../components/DisplayForms/Form1";

const Form1State = ({ year = 2025 }) => {
  return <Form1 sector="STATE" year={year} />;
};

export default Form1State;
