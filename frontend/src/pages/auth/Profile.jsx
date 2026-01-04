import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaUserAlt } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";
import { nanoid } from "nanoid";

const profileItems = [
  {
    id: nanoid(),
    type: "link",
    label: "Personal Info",
    to: "personalinfo",
    icon: <FaUserAlt className="icon-sm" />,
  },
  {
    id: nanoid(),
    type: "link",
    label: "Password Changer",
    to: "passwordchanger",
    icon: <RiLockPasswordFill className="icon-sm" />,
  },
  {
    id: nanoid(),
    type: "link",
    label: "Logout",
    to: "logout",
    // onClick={`() => alert("Yes, You Logged Out!")`},
    icon: <FiLogOut className="icon-sm" />,
  },
];

const Profile = () => {
  return (
    <div className="h-150 w-full p-10">
      <div className="w-full h-full bg-gray-300 overflow-hidden rounded-2xl flex gap-2">
        <div className="bg-gray-200 w-1/4 p-3 px-5">
          <p className="text-2xl font-bold mb-10">Profile Management</p>
          <div className="flex flex-col gap-4">
            {profileItems.map((item) => {
                console.log(item)
              return (
                <NavLink to={item.to} className="flex p-1 items-center gap-4 ">
                  {item.icon}
                  <p className=" font-semibold">{item.label}</p>
                </NavLink>
              );
            })}
          </div>
        </div>
        {/* <hr className="bg-red-500 w-1/10 rotate-90" /> */}
        <div className="w-4/5"><Outlet /></div>
      </div>
    </div>
  );
};

export default Profile;
