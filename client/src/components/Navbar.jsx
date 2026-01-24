import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {Menu} from "lucide-react"
import MobileOptions from './MobileOptions.jsx'
const Navbar = () => {
  const [isopen , setIsOpen]=useState(false);
  console.log(isopen);
  
  return (
    <div className='flex md:px-40  bg-green-50 justify-between' >
      <div className="flex items-center md:hidden">
        <Menu onClick={()=>setIsOpen(!isopen)} className='h-7 w-7' />
      </div>
      <div className="flex items-center  gap-2 flex-row">
        <Link to={"/"}>
        <img src="l2.png" className='h-25 ' alt="logo" />
        </Link>
        
        
        
      </div>
      <div className="flex items-center">
        <Link className='flex bg-white rounded-2xl px-2 py-1  md:hidden' >launchApp</Link>
      </div>
      <div className="hidden md:flex items-center gap-2 flex-row">
        <Link to={"/contact"} className='text-md text-black  px-2 py-2   rounded-2xl ' >Contact</Link>
        <Link to={"/about"} className='text-md text-black  px-2 py-2  rounded-2xl ' >About</Link>
        <Link to={"/launch"} className='text-md   bg-green-700 text-white px-2 py-2   rounded-2xl ' >LaunchApp</Link>
      </div>
      <MobileOptions onClose={() => setIsOpen(false)} open={isopen} />
    </div>
  )
}

export default Navbar