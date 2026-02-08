import React, { useState } from 'react'
import Statement1 from '../../components/Statements/Statement1'
import Statement2 from '../../components/Statements/Statement2'
import Statement3 from '../../components/Statements/Statement3'
import Statement4 from '../../components/Statements/Statement4'
import Statement5 from '../../components/Statements/Statement5'
import Statement6 from '../../components/Statements/Statement6'
import Statement7 from '../../components/Statements/Statement7'
import SearchFunction from '../SearchFunction'
import Button from '../../components/ui/Button'

const TrackStatements = () => {

    const [activeStep, setActiveStep] = useState("1")

    const array = ["1","2","3","4","5","6","7"]

    const stepComponents = {
        "1": <Statement1 />,
        "2": <Statement2 />,
        "3": <Statement3 />,
        "4": <Statement4 />,
        "5": <Statement5 />,
        "6": <Statement6 />,
        "7": <Statement7 />,
    }

  return (
    <div className='w-full h-screen'>
        <SearchFunction />
        <h1 className="px-4 text-xl font-bold mt-5">The Statements are...</h1>
      <div className="w-full p-5 relative">
        <div className="absolute top-11 left-0 w-[50%] translate-x-1/2 h-1 bg-purple-500 z-0" />
        <div className="w-full flex gap-11 items-center relative z-10 justify-center overflow-x-auto">
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
  )
}

export default TrackStatements