import React from 'react'
import { downloadTextFile } from '../utils/csvUtils'
import {printPrintArea} from '../utils/printUtils'

const SearchFunction = () => {
  return (
    <div className='shadow-sm hover:shadow-lg bg-gray-300 w-full h-auto p-4 rounded'>
       <div className="flex gap-5 justify-end items-center">
          <button
            className="bg-blue-300 mt-2 py-2 px-4 rounded cursor-pointer"
            onClick={() => {
              const content = "Name,Code\nRajdeep,123";
              downloadTextFile(content, "departments.csv");
            }}
          >
            Download
          </button>

          <button onClick={printPrintArea} className="bg-blue-300 mt-2 py-2 px-4 rounded cursor-pointer">Print</button>
        </div>
        <h1 className='font-semibold text-xl py-4'>Search Filter</h1>
        <div className='flex gap-5'>
            <select className='border px-4 py-2 cursor-pointer'>
                <option value="">2021-2022</option>
                <option value="">2022-2023</option>
                <option value="">2023-2024</option>
                <option value="">2024-2025</option>
            </select>
            <button className='py-2 px-4 rounded bg-blue-400 cursor-pointer active:scale-95'>Apply Filter</button>
        </div>
    </div>
  )
}

export default SearchFunction