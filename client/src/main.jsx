import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PrivyProvider } from '@privy-io/react-auth'
import { UserProvider } from './config/userContext.jsx'
// Layouts & Pages
import Mainlayout from './layout/mainlayout.jsx'
import Contact from './pages/Contact.jsx'
import About from './pages/About.jsx'
import Launch from './pages/Launch.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from "./pages/profile.jsx"
const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: "/", element: <Mainlayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/contact", element: <Contact /> },
      { path: "/about", element: <About /> },
      { path: "/launch", element: <Launch /> },
      { path: "/profile", element: <Profile /> },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrivyProvider
    
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false, 
        },
      }}
    >
      <UserProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
      </UserProvider>
    </PrivyProvider>
  </StrictMode>,
)