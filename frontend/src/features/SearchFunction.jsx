import React from 'react'

const SearchFunction = () => {
  return (
    <div className='shadow-sm hover:shadow-lg bg-gray-300 w-full h-auto p-4 rounded'>
        <h1 className='font-semibold text-xl py-4'>Search Filter</h1>
        <div className='flex gap-5'>
            <select className='border px-4 py-2 cursor-pointer'>
                <option value="">kangkan</option>
                <option value="">kangkan baishya</option>
                <option value="">kd</option>
            </select>
            <button className='py-2 px-4 rounded bg-blue-400 cursor-pointer active:scale-95'>Apply Filter</button>
        </div>
    </div>
  )
}

export default SearchFunction