import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
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

const SECTOR_LABELS = {
  council: "COUNCIL",
  state: "STATE",
  consolidated: "CONSOLIDATED",
};

const TrackForms = () => {
  const { sector } = useParams();
  const [activeStep, setActiveStep] = useState(1);

  const sectorType = sector ? SECTOR_LABELS[sector.toLowerCase()] || null : null;

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

  const stepComponents = useMemo(
    () => ({
      1: <Form1 sector={sectorType} />,
      2: <Form2 sector={sectorType} />,
      3: <Form3 sector={sectorType} />,
      4: <Form4 sector={sectorType} />,
      "5A": <Form5A sector={sectorType} />,
      "5B": <Form5B sector={sectorType} />,
      "5C": <Form5C sector={sectorType} />,
      "5D": <Form5D sector={sectorType} />,
      "5E": <Form5E sector={sectorType} />,
      6: <Form6 sector={sectorType} />,
      7: <Form7 sector={sectorType} />,
      "7A": <Form7A sector={sectorType} />,
      "7B": <Form7B sector={sectorType} />,
      8: <Form8 sector={sectorType} />,
      9: <Form9 sector={sectorType} />,
      10: <Form10 sector={sectorType} />,
      11: <Form11 sector={sectorType} />,
      12: <Form12 sector={sectorType} />,
    }),
    [sectorType]
  );

  return (
    <div className="w-full h-screen">
      <SearchFunction />
      <h1 className="px-4 text-xl font-bold mt-5">
        The Forms are..
        {sectorType && (
          <span className="ml-2 text-purple-600 font-semibold">
            ({sectorType} {sectorType === "CONSOLIDATED" ? "— Council & State" : "data"})
          </span>
        )}
      </h1>
      <div className="w-full p-5 relative">
        <div className="absolute top-11 left-0 w-[95%] mx-8 h-1 bg-purple-500 z-0" />
        <div className="w-full flex gap-5 items-center relative z-10 justify-center overflow-x-auto">
          {array.map((row, index) => {
            return (
              <div
                key={index}
                onClick={() => setActiveStep(row)}
                className={activeStep === row ? "track-point" : "track-border"}>
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
