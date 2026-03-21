import axios from "axios";
import { useEffect, useState } from "react";
import { adminService } from "../main";
import AdminRestaurantCard from "../components/AdminRestaurantCard";
import RiderAdmin from "../components/RiderAdmin";

const Admin = () => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"restaurant" | "rider">("restaurant");

  const fetchData = async () => {
    try {
      setLoading(true);

      console.log("adminService =", adminService);
      console.log("token =", localStorage.getItem("token"));

      const token = localStorage.getItem("token");

      if (!token) {
        console.log("No token found");
        setRestaurants([]);
        setRiders([]);
        setLoading(false);
        return;
      }

      const [restaurantResponse, riderResponse] = await Promise.all([
        axios.get(`${adminService}/api/v1/admin/restaurant/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(`${adminService}/api/v1/admin/rider/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      console.log("Restaurant API response:", restaurantResponse.data);
      console.log("Rider API response:", riderResponse.data);

      setRestaurants(
        restaurantResponse.data?.restaurants ||
          restaurantResponse.data ||
          []
      );

      setRiders(
        riderResponse.data?.riders ||
          riderResponse.data ||
          []
      );
    } catch (error: any) {
      console.log("Admin fetch error:", error?.response?.data || error.message);
      setRestaurants([]);
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="flex gap-4">
        <button
          onClick={() => setTab("restaurant")}
          className={`rounded px-4 py-2 ${
            tab === "restaurant" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
        >
          Restaurant
        </button>

        <button
          onClick={() => setTab("rider")}
          className={`rounded px-4 py-2 ${
            tab === "rider" ? "bg-red-500 text-white" : "bg-gray-200"
          }`}
        >
          Riders
        </button>
      </div>

      {tab === "restaurant" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {restaurants.length === 0 ? (
            <p>No pending restaurants</p>
          ) : (
            restaurants.map((r) => (
              <AdminRestaurantCard
                key={r._id}
                restaurant={r}
                onVerify={fetchData}
              />
            ))
          )}
        </div>
      )}

      {tab === "rider" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {riders.length === 0 ? (
            <p>No pending riders</p>
          ) : (
            riders.map((r) => (
              <RiderAdmin key={r._id} rider={r} onVerify={fetchData} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;