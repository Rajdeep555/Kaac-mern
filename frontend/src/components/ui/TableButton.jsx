import { GoPlus } from "react-icons/go";

const TableButton = ({ name, icon = <GoPlus />, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 cursor-pointer rounded-full bg-black text-white text-sm font-unbounded font-light flex items-center justify-center gap-2">
      {name}
      <span className="text-white text-xl">{icon}</span>
    </button>
  );
};

export default TableButton;
