import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../src/context/userContext.jsx";

const fetchUser = async (address) => {
  const res = await axios.get(
    `${import.meta.env.VITE_BACKEND_URL}/api/me`,
    {
      params: { address }
    }
  );
  return res.data;
};


const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { address} = useUser();
  console.log(address);
  
  useEffect(() => {
  if (!address) return;

  setLoading(true); 

  const checkUser = async () => {
    try {
      const user = await fetchUser(address);
      setIsAdmin(user.isAdmin);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  checkUser();
}, [address]);

  if (loading) return <div>Loading...</div>;

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;