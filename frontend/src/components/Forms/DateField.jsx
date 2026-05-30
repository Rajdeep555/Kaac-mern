// const DateField = ({
//   label,
//   name,
//   value,
//   onChange,
//   futureDate = false,
//   readonly = false,
//   min,
//   max,
//   register,
// }) => {
//   const today = new Date().toISOString().split("T")[0];

//   return (
//     <div className="flex flex-col gap-1">
//       <label className="text-sm font-medium">{label}</label>

//       <input
//         type="date"
//         name={name}
//         disabled={readonly}
//         min={min}
//         max={futureDate ? undefined : today}
//         {...(register ? register(name) : { value, onChange })}
//         className={`border border-zinc-400 rounded px-3 py-2 outline-none
//           ${
//             readonly
//               ? "bg-gray-300 cursor-not-allowed"
//               : "focus:ring-1 focus:ring-blue-500"
//           }`}
//       />
//     </div>
//   );
// };

// export default DateField;

// components/Forms/DateField.jsx
const DateField = ({
  label,
  name,
  value,
  onChange,
  futureDate = false,
  readonly = false,
  min,
  max,
  register,
}) => {
  const today = new Date().toISOString().split("T")[0];
  const registration = register ? register(name) : null;

  const handleChange = (e) => {
    registration?.onChange(e); // ✅ keep RHF's internal state in sync
    onChange?.(e); // ✅ then run your custom validation handler
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>

      <input
        type="date"
        name={name}
        disabled={readonly}
        min={min}
        max={max || (futureDate ? undefined : today)}
        {...(registration ?? { value })}
        onChange={handleChange}
        className={`border border-zinc-400 rounded px-3 py-2 outline-none
          ${
            readonly
              ? "bg-gray-300 cursor-not-allowed"
              : "focus:ring-1 focus:ring-blue-500"
          }`}
      />
    </div>
  );
};

export default DateField;
