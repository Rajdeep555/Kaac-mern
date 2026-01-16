const TextAreaField = ({ label, name, value, onChange, rows = 3 }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="border border-zinc-400 outline-none rounded px-3 py-2 resize-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
};

export default TextAreaField;
