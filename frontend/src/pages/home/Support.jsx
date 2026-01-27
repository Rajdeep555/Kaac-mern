import React from "react";
import { TbDownload } from "react-icons/tb";


const Support = () => {
  const SupportHistory = [
    {
      id: "SR#136354726",
      type: "Refund Request",
      date: "20/01/2023",
      status: "Pending",
      statusColor: "text-purple-500",
    },
    {
      id: "SR#136354745",
      type: "Reissue Request",
      date: "25/01/2023",
      status: "Approve",
      statusColor: "text-green-500",
    },
    {
      id: "SR#136354787",
      type: "VIP Request",
      date: "23/01/2023",
      status: "Process",
      statusColor: "text-blue-500",
    },
    {
      id: "SR#136354787",
      type: "VIP Request",
      date: "23/01/2023",
      status: "Cencelled",
      statusColor: "text-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Support Page</h1>
        <p className="text-sm text-gray-500">
          When you have problems, they open support.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Raise An Issue</h2>
        <p className="text-sm text-gray-500 mb-6">
          Fill up all the information here, then click submit button
        </p>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Request Type */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Select Request Type *
            </label>
            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Reissue Request</option>
              <option>Cencel Request</option>
            </select>
          </div>

          {/* Search PNR */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Phone Number
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                value="+91-01010101"
                readOnly
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm pr-10"
              />
              {/* <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                🔍
              </span> */}
            </div>
          </div>

          {/* Passenger Name */}
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              value="Mark Andarson"
              readOnly
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Ticket Number */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Code Number
            </label>
            <input
              type="tel"
              value="996502333736727"
              readOnly
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Reissue Reason */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Choose Reissue Reason
            </label>
            <select className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Voluntary Reissue</option>
            </select>
          </div>

          {/* Change Date */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Change Date
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Remarks */}
          <div className="">
            <label className="text-sm font-medium text-gray-600">Remarks</label>
            <input
              type="textarea"
              placeholder="Write your remarks"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer active:scale-95 transition">
            Submit Issue
          </button>
        </div>
      </div>

      {/* Second Section */}
      <div className="w-full flex mt-5 gap-5">
        <div className="bg-white rounded-xl w-full shadow-sm hover:shadow-md border border-gray-200 p-6">
          <div className="w-full flex items-start justify-between">
           <div>
             <h2 className="text-xl font-bold text-gray-900 mb-1">
            Latest Support History
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Here is your most recent history.
          </p>
           </div>
           <div onClick={() => alert("downloading...")} className="flex items-center gap-2 cursor-pointer ">
            <TbDownload className="icon-md active:scale-95" />
            <span className="text-md font-semibold">Download</span>
           </div>
          </div>

          {/* Form */}
          <div className="flex flex-col w-full gap-6">
            {SupportHistory.map((data, index) => {
              return (
                <div>
                  <div key={index} className="grid grid-cols-4 gap-25">
                    <div className="w-full flex flex-col gap-1">
                      <h1 className="font-bold text-lg">{data.id}</h1>
                      <p className="text-sm">Support Req No</p>
                    </div>
                    <div className="w-full flex flex-col gap-1">
                      <h1 className="font-bold">{data.type}</h1>
                      <p className="text-sm">Support Type</p>
                    </div>
                    <div className="w-full flex flex-col gap-1">
                      <h1 className="font-bold">{data.date}</h1>
                      <p className="text-sm">Date</p>
                    </div>
                    <div className="w-full flex flex-col gap-1">
                      <h1 className={`font-bold text-lg ${data.statusColor}`}>
                        {data.status}
                      </h1>
                      <p className="text-sm">Status</p>
                    </div>
                  </div>
                  <div className="w-full h-px py-2 border-black border-b "></div>
                </div>
              );
            })}
          </div>
        </div>
        {/* <div className="bg-white min-w-[30%] shadow-sm hover:shadow-md rounded-xl flex p-5">
          <div>
            <h1 className="font-semibold text-lg">About KAAC</h1>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Support;
