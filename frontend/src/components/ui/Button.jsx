import React from 'react'
import { useNavigate } from 'react-router-dom'

const Button = () => {
    const navigate = useNavigate()
  return (
    <div>
        <button onClick={() => navigate(-1)} className='mx-4 px-6 py-2 bg-green-400 cursor-pointer active:scale-95 rounded my-5'>Go Back</button>
    </div>
  )
}

export default Button