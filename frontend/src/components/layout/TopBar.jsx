import React, { useEffect, useState } from "react";
import { AiFillBell } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { menuItems } from "./SideBar";
import { NavLink } from "react-router";
import { BsArrowRight } from "react-icons/bs";

const TopBar = () => {

  const [search, setSearch] = useState("");

  const [searchItem, setSearchItem] = useState([]);

  const [index, setIndex] = useState(-1)

  useEffect(() => {
    if (!search) {
      setSearchItem([]);
      setIndex(-1)
      return;
    }

    const result = menuItems.filter(
      (item) =>
        item.type === "link" &&
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    if(!result.length){
      setSearchItem("not found item")
    }

    setSearchItem(result);
    setIndex(-1)
  }, [search]);

  // console.log(searchItem);

  return (
    <div className="h-[10%] w-full bg-gray-300  ">
      <div className="w-[90%] bg-amber-00 mx-auto min-h-full flex justify-between items-center">
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if(e.key === "ArrowDown"){
                e.preventDefault()
                setIndex((prev) => 
                  prev < searchItem.length -1 ? prev + 1 : 0
                )
              } 
              if (e.key === "ArrowUp"){
                e.preventDefault()
                setIndex((prev) => 
                  prev > 0 ? prev -1 : searchItem.length - 1
                )
              }
              if (e.key === "Enter" && index >= 0) {
                window.location.href = searchItem[index].to
                setSearch('')
              }
            }}
            className="outline-0 border-b w-100 px-4 py-2 "
            type="search"
            placeholder="Search "
          />
        </div>
        <div className="flex gap-5">
          <AiFillBell
            onClick={() => alert("No Notifications yet!")}
            className="icon-md icon-cursor "
          />
          <CgProfile className="icon-md icon-cursor " />
        </div>
      </div>
      {search.length > 0 &&  (
        <div className="h-auto w-100 bg-gray-300 -mt-5 ml-15 flex flex-col rounded overflow-hidden relative z-50">
          
          {searchItem.length !== 0 ? (searchItem.map((item, i) => {
            return (
              <NavLink
                key={item.id}
                onClick={() => setSearch("")}
                to={item.to}
                className={` cursor-pointer p-3 w-full flex justify-between items-center px-4
                  ${i === index ? "bg-gray-500" : "hover:bg-gray-500" }
                `}>
                {item.label}
                <BsArrowRight />
              </NavLink>
            );
          })) : (<span className="py-2.5 px-2 text-navlink-red">Not Found</span>)}
          {console.log(searchItem[0])}
        </div>
      )}
    </div>
  );
};

export default TopBar;
