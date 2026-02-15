// const FormWrapper = ({ children, onSubmit }) => {
//   return (
//     <form
//       onSubmit={onSubmit}
//       className="grid grid-cols-3 md:grid-cols-3 gap-3 gap-y-4 mt-4">
//       {children}

//       <div className="col-span-full">
//         <button className="bg-blue-600 text-white w-32 font-unbounded font-light px-6 py-2 rounded-lg">
//           Submit
//         </button>
//       </div>
//     </form>
//   );
// };

// export default FormWrapper;
const FormWrapper = ({
  children,
  onSubmit,
  submitText = "Submit",
  isSubmitting = false,
  showSubmit = true,
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-3 md:grid-cols-3 gap-3 gap-y-4 mt-4">
      {children}

      {showSubmit && (
        <div className="col-span-full flex justify-end gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white min-w-32 font-unbounded font-light px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? "Submitting..." : submitText}
          </button>
        </div>
      )}
    </form>
  );
};

export default FormWrapper;
