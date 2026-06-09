import { GoPlus } from "react-icons/go";
import { LuReceipt } from "react-icons/lu";

const TableButton = ({ name, icon, onClick }) => {
  const defaultIcon = icon ?? <GoPlus />;

  return (
    <button
      onClick={onClick}
      className="px-5 py-2 cursor-pointer rounded-full bg-black text-white text-sm font-unbounded font-light flex items-center justify-center gap-2">
      {name}
      <span className="text-white text-xl">{defaultIcon}</span>
    </button>
  );
};

export { LuReceipt };
export default TableButton;
