const RadioGroup = ({ label, name, value, onChange, options }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>

      <div className="flex gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-1">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={onChange}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default RadioGroup;
