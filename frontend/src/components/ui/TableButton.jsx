import { GoPlus } from "react-icons/go";

const TableButton = ({ name, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2 rounded-full bg-black text-white text-sm font-unbounded font-light flex items-center justify-center gap-2">
      {name}
      <GoPlus className="text-white text-xl" />
    </button>
  );
};

export default TableButton;
