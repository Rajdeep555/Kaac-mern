const FormWrapper = ({ children, onSubmit }) => {
  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-3 md:grid-cols-3 gap-3 gap-y-4 mt-4">
      {children}

      <div className="col-span-full">
        <button className="bg-blue-600 text-white w-32 font-unbounded font-light px-6 py-2 rounded-lg">
          Submit
        </button>
      </div>
    </form>
  );
};

export default FormWrapper;
