import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Contact from './pages/Contact.jsx'
import { createBrowserRouter , RouterProvider } from 'react-router-dom'
import {QueryClient , QueryClientProvider} from "@tanstack/react-query"
import Mainlayout from './layout/mainlayout.jsx'
import About from './pages/About.jsx'
import Launch from './pages/Launch.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { WagmiProvider } from 'wagmi'
import{config} from "./wagmi"
const queryClient=new QueryClient()
const router=createBrowserRouter([
  {
    path:"/",element:<Mainlayout/>,
    children:[
      {path:"/",element:<Dashboard/>},
      {path:"/contact",element:<Contact/>},
      {path:"/about",element:<About/>},
      {path:"/launch",element:<Launch/>},
    ]
  }
])


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config} >
    <QueryClientProvider client={queryClient} >
      <RouterProvider router={router}  />
    </QueryClientProvider >
    </WagmiProvider >
  </StrictMode>,
)
