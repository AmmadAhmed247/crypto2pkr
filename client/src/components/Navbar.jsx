import React, { useState } from 'react'
import { Link, useNavigate   } from 'react-router-dom'
import { Menu, LogOut, User as UserIcon , BringToFront } from "lucide-react"
import MobileOptions from './MobileOptions.jsx'
import { useUser } from "../context/userContext" 
import { Provider, L1Signer } from "zksync-ethers";
import { ethers } from "ethers";

const Navbar = () => {
  const [isopen, setIsOpen] = useState(false);
    const { isAuthenticated, logout, address, wallet } = useUser();
  const navigate = useNavigate();
  const [bridging, setBridging] = useState(false)

  const handleDisconnect = () => {
    logout(); 
    navigate("/"); 
  };


  return (
    <div className='flex md:px-40 bg-green-50 justify-between items-center h-20 shadow-sm'>
      <div className="flex items-center md:hidden px-4">
        <Menu onClick={() => setIsOpen(!isopen)} className='h-7 w-7 text-green-800 cursor-pointer' />
      </div>
      <div className="flex items-center gap-2">
        <Link to={"/"}>
          <img src="l2.png" className='h-16' alt="logo" />
        </Link>
      </div>
      {/* <button 
              onClick={handleDisconnect}
              className='flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-all active:scale-95'
            >
              <LogOut size={16} />
              Disconnect
            </button> */}
      
      <div className="hidden md:flex items-center gap-4">
        <Link to={"/contact"} className='text-sm font-medium text-gray-700 hover:text-green-700 transition-colors'>Contact</Link>
        <Link to={"/about"} className='text-sm font-medium text-gray-700 hover:text-green-700 transition-colors'>About</Link>
        
        {isAuthenticated ? (
          <>
          <Link to={"/launch"} className='flex items-center gap-2 bg-green-300 border border-green-200 text-zinc-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-green-200 transition-all'>
              <BringToFront size={16} />
              Bridge
            </Link>
            
            <Link to={"/profile"} className='flex items-center gap-2 bg-white border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-green-50 transition-all'>
              <UserIcon size={16} />
              Dashboard
            </Link>
            <button 
              onClick={handleDisconnect}
              className='flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 hover:bg-red-100 transition-all active:scale-95'
            >
              <LogOut size={16} />
              Disconnect
            </button>
          </>
        ) : (
          <Link to={"/launch"} className='bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-green-200 hover:bg-green-800 transition-all active:scale-95'>
            Launch App
          </Link>
        )}
      </div>


      {!isAuthenticated && (
        <div className="md:hidden px-4">
          <Link to="/launch" className='bg-green-700 text-white rounded-xl px-4 py-1.5 text-xs font-bold'>Launch</Link>
        </div>
      )}

      <MobileOptions onClose={() => setIsOpen(false)} open={isopen} />
    </div>
  )
}

export default Navbar