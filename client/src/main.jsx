import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { createBrowserRouter , RouterProvider } from 'react-router-dom'
import {QueryClient , QueryClientProvider} from "@tanstack/react-query"
import Mainlayout from './layout/mainlayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
const queryClient=new QueryClient()
const router=createBrowserRouter([
  {
    path:"/",element:<Mainlayout/>,
    children:[
      {path:"/",element:<Dashboard/>}
    ]
  }
])
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient} >
      <RouterProvider router={router}  />
    </QueryClientProvider >
  </StrictMode>,
)
