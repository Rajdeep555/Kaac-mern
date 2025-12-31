import React, { useState } from "react";
import { GrUpdate } from 'react-icons/gr'

const Personalnfo = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        role: ""
    })

    const handleSubmit = (e) => {
        e.preventDefault()
    }

  return (
    <div className=" h-full w-full p-5">
      <div className="w-full h-full px-3 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold font-unbounded">
            Personal Information
          </h1>
        </div>
        <hr />
        <div>
          <img
            className="w-20 h-20 ml-5 rounded-full"
            src="https://static.vecteezy.com/system/resources/previews/007/409/979/original/people-icon-design-avatar-icon-person-icons-people-icons-are-set-in-trendy-flat-style-user-icon-set-vector.jpg"
            alt=""
          />
        </div>
        <hr />
        <form onSubmit={handleSubmit} className="w-full px-5 ">
          <div className="w-full flex justify-between gap-3">
            <div className="w-1/2 flex flex-col gap-3">
              <label htmlFor="name">
                Name
              </label>
              <input
                type="text"
                placeholder="your name"
                className="outline-2 py-2 px-4 rounded-full focus:outline-blue-500"
              />
            </div>
            <div className="w-1/2 flex flex-col gap-3">
              <label htmlFor="email">
                email
              </label>
              <input
                type="email"
                placeholder="your email"
                className="outline-2 py-2 px-4 rounded-full focus:outline-blue-500"
              />
            </div>
          </div>
          <div className=" pt-5 w-full flex justify-between gap-3">
            <div className="w-1/2 flex flex-col gap-3">
              <label htmlFor="phone">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="your phone number"
                className="outline-2 py-2 px-4 rounded-full focus:outline-blue-500"
              />
            </div>
            <div className="w-1/2 flex flex-col gap-3">
              <label htmlFor="role">
                Role
              </label>
              <input
                type="text"
                placeholder="your role"
                className="outline-2 py-2 px-4 rounded-full focus:outline-blue-500"
              />
            </div>
          </div>
            <div className=" text-center mt-7 flex items-end flex-col rounded-full">
                <button className="py-4 bg-green-400 px-7 rounded-full flex items-center gap-3 cursor-pointer active:scale-95"><GrUpdate />Update</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Personalnfo;
