import React from "react";
import { Link } from "react-router-dom";
import {Home , PhoneCallIcon ,UserRound   } from "lucide-react"
const MobileOptions = ({ open, onClose }) => {
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
          <Link to={"/launchapp"} className="cursor-pointer rounded-xl text-center bg-green-800 text-white font-[Inter] px-2 py-1 hover:text-purple-50 transition-colors " onClick={onClose}>
            Launch App
          </Link>
        </div>
        <div className="flex items-center justify-center">
        <span className="absolute bottom-1 border-zinc-400 text-xs " >© 2026 Rupia All Rights Reserved.</span>
        </div>
      </div>
    </div>
  );
};

export default MobileOptions;
