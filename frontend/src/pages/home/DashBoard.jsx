import React, { useEffect, useState } from "react";
import DashboardBox from "../../components/ui/DashboardBox";

const DashBoard = () => {
  const [greetings, setGreetings] = useState("")

  useEffect(() => {
  const date = new Date()
  const hour =  date.getHours()

    if(hour >= 0 && hour < 12){
      setGreetings("Good Morning")
    } else if (hour >= 12 && hour < 18) {
      setGreetings("Good Afternoon")
    } else  {
      setGreetings("Good Evening")
    }

  }, [])

  return (
    <div className="h-screen w-full px-7 flex flex-col gap-7">
      <div className="h-35 w-full mx-auto rounded-2xl overflow-hidden bg-gradient-to-r from-sky-100 to-indigo-200 shadow-lg shadow-black/40">
         <div className="p-5 py-3">
            <p className="text-2xl font-bold pb-5 font-unbounded">{greetings}</p>
            <p className="text-2xl font-semibold font-unbounded">Welcome Kangkan Baishya</p>
          </div>
      </div>
      <div className=" h-full w-full flex gap-5">
        <DashboardBox />
        <DashboardBox />
        <DashboardBox />
        <DashboardBox />
      </div>
    </div>
  );
};

export default DashBoard;
