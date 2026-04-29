import React, { useEffect, useState } from "react";
import axios, { all } from "axios";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

const Admin = () => {
  const [address, setAddress] = useState("");
  const [debouncedAddress, setDebouncedAddress] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAddress(address);
    }, 2000);
    return () => clearTimeout(timer);
  }, [address]);


  const trunc = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—';
  const fmt = (d) => new Date(d).toLocaleDateString('en-pk', { day: 'numeric', month: 'short', year: 'numeric' });


  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/transactions`
      );
      return res.data;
    },
    refetchInterval: 10000,
  });



  const { data: userData, isLoading: userLoading, isFetching: isSearching } = useQuery({
    queryKey: ["userData", debouncedAddress],
    queryFn: async () => {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/analytics/${debouncedAddress}`
      );
      return res.data.transactions;
    },
    enabled: !!debouncedAddress,
  });

  const confirmPayout = async (userAddress, requestId) => {
    try {
      
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/confirm-payout`,
        {
          userAddress: userAddress,
          requestId
        },
        {
          headers: {
            "x-admin-key": `${import.meta.env.VITE_ADMIN_SECRETS}`
          }
        }
      )
      toast.success("payout successfull")
    } catch (error) {
      if (error.message.includes("400")) {
        toast.error("Already Paid ");
}
    }
  }

  const isLocked = allData?.data?.filter((tx) => tx.status == 'locked');
  console.log(`locked amount:`, isLocked?.length() > 0 ? isLocked.length : "0");






  const tableData = debouncedAddress ? userData : allData;

  if (allLoading) {
    return (
      <div className="flex items-center min-h-screen justify-center h-[300px]">
        <div className="w-100 h-100 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4">

      <div className="flex items-center justify-center gap-3 mb-6 relative">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-[500px] h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 transition"
          type="text"
          placeholder="Search by Address..."
        />

        <Search size={20} className="text-gray-500" />

        {(userLoading || isSearching) && debouncedAddress && (
          <div className="absolute right-10">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>


      <table className="min-w-full border-2 border-t-zinc-200 border-gray-300 text-sm">
        <thead className="bg-green-100">
          <tr>
            <th className="p-2 border">User Address</th>
            <th className="p-2 border">Raast ID</th>
            <th className="p-2 border">Lock TX Hash</th>
            <th className="p-2 border">Payout TX Hash</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">PKR Amount</th>
            <th className="p-2 border">Initiate payout</th>
          </tr>
        </thead>

        <tbody className="text-center">
          {tableData?.length > 0 ? (
            tableData.map((d) => (
              <tr key={d._id} className="hover:bg-green-50 transition">
                <td className="p-2 border">{trunc(d.userAddress)}</td>
                <td className="p-2 border">{d.raastId}</td>
                <td className="p-2 border break-all">{d.lockTxHash}</td>
                <td className="p-2 border break-all">{d.payoutTxHash}</td>
                <td className="p-2 border">{fmt(d.updatedAt)}</td>
                <td className="p-2 border">{d.type}</td>
                <td className="p-2 border">{d.status}</td>
                <td className="p-2 border">{d.pkrAmount}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => confirmPayout(d.userAddress, d.requestId)}
                    className="px-3 py-1 bg-green-500 text-white rounded"
                  >
                    Confirm
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="p-4 text-gray-400">
                No results found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Admin;