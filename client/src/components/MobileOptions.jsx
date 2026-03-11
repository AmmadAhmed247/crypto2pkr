import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {Home , PhoneCallIcon ,UserRound , UserIcon, LogOut  ,BringToFront } from "lucide-react"
import {useUser} from "../context/userContext.jsx"
const MobileOptions = ({ open, onClose }) => {

  const {address , logout , isAuthenticated}=useUser();
  const navigate=useNavigate();
  const handleDisconnect=async()=>{
    logout();
    navigate("/");
  }


  return (
    <div className="fixed inset-0 md:hidden z-50 pointer-events-none">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-600 ${open ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute top-0 left-0 h-full w-64  bg-white  transition-transform duration-700 ease-in-out  ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-6   flex flex-col gap-8 pointer-events-auto ">
          <div className="flex items-center gap-2 flex-row">
          <img src="l2.png" className="rounded-2xl w-50" alt="" />
      
          </div>
          <div className="flex flex-row gap-2 items-center">
            <Home  size={25} />
          <Link to={"/"} className="cursor-pointer rounded-xl px-2 py-1 hover:text-green-800 transition-colors font-medium" onClick={onClose}>
            Home
          </Link>
          
          </div>
         <div className="flex flex-row gap-2 items-center">
            <PhoneCallIcon  size={25} />
          <Link to={"/contact"} className="cursor-pointer rounded-xl px-2 py-1 hover:text-green-600 transition-colors font-medium" onClick={onClose}>
            Contact
          </Link>
          
          </div>
           <div className="flex flex-row gap-2 items-center">
            <UserRound    size={25} />
          <Link to={"/about"} className="cursor-pointer rounded-xl px-2 py-1 hover:text-green-600 transition-colors font-medium" onClick={onClose}>
            About
          </Link>
          
          </div>
         {isAuthenticated ? (
          <>
            <Link to={"/launch"} className='flex items-center gap-2 bg-green-300 border border-green-200 text-zinc-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-green-50 transition-all'>
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
        <div className="flex items-center justify-center">
        <span className="absolute bottom-1 border-zinc-400 text-xs " >© 2026 Rupia All Rights Reserved.</span>
        </div>
      </div>
    </div>
  );
};

export default MobileOptions;
