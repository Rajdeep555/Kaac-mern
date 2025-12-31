import React, { useState } from 'react'
import { GrUpdate } from 'react-icons/gr'

const PasswordChanger = () => {
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

const handleSubmit = (e) => {
  e.preventDefault()
  setPassword("")
  setNewPassword("")
}

  return (
    <div className=" h-full w-full p-5">
      <div className="w-full h-full px-3 flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold font-unbounded">
            Password Changer
          </h1>
        </div>
        <hr />
        <div>
          <img
            className="w-20 h-20 ml-5 rounded-full"
            src="https://static.vecteezy.com/system/resources/previews/007/409/979/original/people-icon-design-avatar-icon-person-icons-people-icons-are-set-in-trendy-flat-style-user-icon-set-vector.jpg"
            alt=""
          />
        </div>
        <hr />
        <form onSubmit={handleSubmit} className="w-full px-5 ">
          <div className="w-full">
            <div className=" flex flex-col gap-5 mb-5">
              <label htmlFor="password">
                New Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="text"
                placeholder="Enter New Password"
                className="outline-2 py-2 px-4 rounded-full focus:outline-blue-500"
              />
            </div>
            <div className=" flex flex-col gap-5">
              <label htmlFor="password">
                Confirm Password
              </label>
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="text"
                placeholder="Confirm New Password"
                className="outline-2 py-2 px-4 rounded-full focus:outline-blue-500"
              />
            </div>
          </div>
            <div className=" text-center mt-7 flex items-end flex-col rounded-full">
                <button className="py-4 bg-green-400 px-7 rounded-full flex items-center gap-3 cursor-pointer active:scale-95"><GrUpdate />Update</button>
            </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordChanger