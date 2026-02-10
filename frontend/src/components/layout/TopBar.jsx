import React, { useEffect, useState } from "react";
import { AiFillBell } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import { menuItems } from "./SideBar";
import { Link, NavLink, useNavigate } from "react-router";
import { BsArrowRight } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";

const TopBar = () => {
  const { user, role } = useAuth();

  const [search, setSearch] = useState("");

  const [searchItem, setSearchItem] = useState([]);

  const [index, setIndex] = useState(-1);

  const navigate = useNavigate();

  useEffect(() => {
    if (!search) {
      setSearchItem([]);
      setIndex(-1);
      return;
    }

    const results = [];

    menuItems.forEach((item) => {
      if (!item.roles.includes(user.role)) return;

      //direvt link
      if (
        item.type === "link" &&
        item.label.toLowerCase().includes(search.toLowerCase())
      ) {
        results.push({
          ...item,
          searchKey: `link-${item.to}`,
        });
      }

      //dropdown children
      if (item.type === "dropdown" && item.children) {
        item.children.forEach((child) => {
          if (child.label.toLowerCase().includes(search.toLowerCase())) {
            results.push({
              ...child,
              searchKey: `child-${item.key}-${child.to}`,
            });
          }
        });
      }
    });

    if (!results.length) {
      setSearchItem("not found item");
    }
    // console.log(results);

    setSearchItem(results);
    setIndex(-1);
  }, [search, user.role]);

  // console.log(searchItem);

  return (
    <div className="h-20 w-full bg-background ml-1 shadow">
      <div className="w-[90%] bg-amber-00 mx-auto h-full flex justify-between items-center">
        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (!searchItem.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((prev) =>
                  prev < searchItem.length - 1 ? prev + 1 : 0,
                );
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((prev) =>
                  prev > 0 ? prev - 1 : searchItem.length - 1,
                );
              }
              if (e.key === "Enter" && index >= 0) {
                navigate(searchItem[index].to);
                setSearch("");
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
          <CgProfile
            onClick={() => navigate(`/profile`)}
            className="icon-md icon-cursor "
          />
        </div>
      </div>
      {search.length > 0 && (
        <div className="h-auto w-100 bg-gray-300 -mt-5 ml-15 flex flex-col rounded overflow-hidden relative z-50">
          {searchItem.length !== 0 ? (
            searchItem.map((item, idx) => {
              return (
                <Link
                  onClick={() => setSearch("")}
                  to={item.to}
                  className={`cursor-pointer p-3 w-full flex justify-between items-center px-4
                  ${idx === index ? "bg-gray-500" : "hover:bg-gray-500"}
                `}
                  key={item.id}>
                  {item.label}
                  <BsArrowRight />
                </Link>
              );
            })
          ) : (
            <span className="py-2.5 px-2 text-navlink-red">Not Found</span>
          )}
          {console.log(index)}
        </div>
      )}
    </div>
  );
};

export default TopBar;
