import React, { useState } from "react";
import { useNavigation } from "react-router-dom";
import Form1 from "../../components/DisplayForms/Form1";
import Form2 from "../../components/DisplayForms/Form2";
import Form3 from "../../components/DisplayForms/Form3";
import Form4 from "../../components/DisplayForms/Form4";
import Form5A from "../../components/DisplayForms/Form5A";
import Form5B from "../../components/DisplayForms/Form5B";
import Form5C from "../../components/DisplayForms/Form5C";
import Form5D from "../../components/DisplayForms/Form5D";
import Form5E from "../../components/DisplayForms/Form5E";
import Form6 from "../../components/DisplayForms/Form6";
import Form7 from "../../components/DisplayForms/Form7";
import Form7A from "../../components/DisplayForms/Form7A";
import Form7B from "../../components/DisplayForms/Form7B";
import Form8 from "../../components/DisplayForms/Form8";
import Form9 from "../../components/DisplayForms/Form9";
import Form10 from "../../components/DisplayForms/Form10";
import Form11 from "../../components/DisplayForms/Form11";
import Form12 from "../../components/DisplayForms/Form12";
import SearchFunction from "../SearchFunction";
import Button from "../../components/ui/Button";

const TrackForms = () => {
  const navigate = useNavigation();
  const [activeStep, setActiveStep] = useState(1);

  const array = [
    "1",
    "3",
    "4",
    "5A",
    "5B",
    "5C",
    "5D",
    "5E",
    "6",
    "7",
    "7A",
    "7B",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  const stepComponents = {
    1: <Form1 />,
    2: <Form2 />,
    3: <Form3 />,
    4: <Form4 />,
    "5A": <Form5A />,
    "5B": <Form5B />,
    "5C": <Form5C />,
    "5D": <Form5D />,
    "5E": <Form5E />,
    6: <Form6 />,
    7: <Form7 />,
    "7A": <Form7A />,
    "7B": <Form7B />,
    8: <Form8 />,
    9: <Form9 />,
    10: <Form10 />,
    11: <Form11 />,
    12: <Form12 />,
  };

  return (
    <div className="w-full h-screen">
      <SearchFunction />
      <h1 className="px-4 text-xl font-bold mt-5">The Forms are..</h1>
      <div className="w-full p-5 relative">
        <div className="absolute top-11 left-0 w-[95%] mx-8 h-1 bg-purple-500 z-0" />
        <div className="w-full flex gap-5 items-center relative z-10 justify-center overflow-x-auto">
          {array.map((row, index) => {
            return (
              <div
                key={index}
                onClick={() => setActiveStep(row)}
                className={activeStep === row ? "track-point" : "track-border"}
              >
                {row}
              </div>
            );
          })}
        </div>

        <div className="mt-10">{stepComponents[activeStep]}</div>
      </div>
    <Button />
    </div>
  );
};

export default TrackForms;
