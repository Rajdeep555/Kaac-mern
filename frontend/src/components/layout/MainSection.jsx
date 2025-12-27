import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";
import TopBar from "./TopBar";

const MainSection = () => {
  return (
    <div className="h-screen max-w-full bg-white flex overflow-hidden">
      <Sidebar />
      <div className="h-screen w-[80%] bg-red-00 flex flex-col">
        <TopBar />
        <div className="px-2 py-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainSection;
