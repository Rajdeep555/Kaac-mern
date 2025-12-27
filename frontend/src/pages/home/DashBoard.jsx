import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/layout/SideBar'
import TopBar from '../../components/layout/TopBar'



const DashBoard = () => {
  return (
    <div className='h-screen w-full bg-white flex gap-2 '>
        <Sidebar />
        <div className='h-screen w-[80%] bg-red-00 flex flex-col '>
            <TopBar />
            <Outlet />
        </div>
    </div>
  )
}

export default DashBoard