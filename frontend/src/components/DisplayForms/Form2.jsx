import React from 'react'

const Form2 = ({ sector }) => {
  return (
    <div>
      Form2
      {sector && <span className="ml-2 text-gray-600">({sector})</span>}
    </div>
  );
};

export default Form2