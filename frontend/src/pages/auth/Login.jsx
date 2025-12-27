import React from 'react'

const Login = () => {
  return (
    <div className="h-screen w-full bg-gray-300 flex justify-center items-center">
      <div className="w-[55%] h-[60%] rounded-2xl flex overflow-hidden">
        <div className="w-2/5 bg-button-green h-full flex flex-col items-center justify-center px-10 text-center gap-3">
          <h1 className="text-4xl text-white font-bold whitespace-nowrap ">
            Welcome Back!
          </h1>
          <p className="leading-5 text-white">
            To keep connect with us please login with your personal info
          </p>
        </div>
        <div className="w-3/5 bg-white flex flex-col justify-center items-center gap-5">
          <h1 className="text-4xl font-bold text-button-green ">
            Login to KAAC Software
          </h1>
          <p className="text-gray-500">this is for fun</p>
          <div className="w-[70%] p-3 flex flex-col gap-4">
            <input
              className="bg-gray-200 p-3 outline-0 rounded "
              required
              type="email"
              placeholder="Enter Your Email"
            />
            <input
              className="bg-gray-200 p-3 outline-0 rounded"
              required
              type="password"
              placeholder="Enter Your Password"
            />
            <button
              className="bg-button-green w-1/2 mx-auto mt-3 py-3 rounded-full text-white cursor-pointer active:scale-95 "
              type="submit"
            >
              LOGIN
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login