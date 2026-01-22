import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {Menu} from "lucide-react"
import MobileOptions from './MobileOptions.jsx'
const Navbar = () => {
  const [isopen , setIsOpen]=useState(false);
  console.log(isopen);
  
  return (
    <div className='flex p-2 bg-purple-200 justify-between' >
      <div className="flex items-center md:hidden">
        <Menu onClick={()=>setIsOpen(!isopen)} className='h-7 w-7' />
      </div>
      <div className="flex items-center  gap-2 flex-row">
        <img style={{animationDuration:"6s"}} src="image.png" className='rounded-2xl animate-spin h-14 w-14' alt="logo" />
        <span className='text-xl flex md:hidden' >Crypto2Pkr</span>
        <Link className='font-extrabold hidden md:flex text-3xl' >Crypto2Pkr</Link>
      </div>
      <div className="flex items-center">
        <Link className='flex bg-white rounded-2xl px-2 py-1  md:hidden' >launchApp</Link>
      </div>
      <div className="hidden md:flex items-center gap-2 flex-row">
        <Link to={"/contact"} className='text-md px-2 rounded-2xl ' >Contact</Link>
        <Link to={"/about"} className='text-md px-2 rounded-2xl ' >About</Link>
        <Link to={"/launch"} className='text-md px-2 bg-white text-purple-950  py-1  rounded-2xl ' >LaunchApp</Link>
      </div>
      <MobileOptions onClose={() => setIsOpen(false)} open={isopen} />
    </div>
  )
}

export default Navbar