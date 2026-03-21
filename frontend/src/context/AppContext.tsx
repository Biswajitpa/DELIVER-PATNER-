import axios from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService, restaurantService } from "../main";
import type { AppContextType, ICart, LocationData, User } from "../types";
import { Toaster } from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [city, setCity] = useState("Fetching Location...");

  const [cart, setCart] = useState<ICart[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [quauntity, setQuauntity] = useState(0);

  async function fetchUser() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUser(null);
        setIsAuth(false);
        return;
      }

      const { data } = await axios.get(`${authService}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCart() {
    if (!user || user.role !== "customer") return;

    try {
      const { data } = await axios.get(`${restaurantService}/api/cart/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setCart(data.cart || []);
      setSubTotal(data.subtotal || 0);
      setQuauntity(data.cartLength || 0);
    } catch (error) {
      console.log(error);
      setCart([]);
      setSubTotal(0);
      setQuauntity(0);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user && user.role === "customer") {
      fetchCart();
    }
  }, [user]);

  useEffect(() => {
    const savedLocation = localStorage.getItem("selectedLocation");
    const savedCity = localStorage.getItem("selectedCity");

    // First use selected address if user already chose one
    if (savedLocation) {
      try {
        const parsedLocation: LocationData = JSON.parse(savedLocation);
        setLocation(parsedLocation);
        setCity(savedCity || parsedLocation.formattedAddress || "Your Location");
        setLoadingLocation(false);
        return;
      } catch (error) {
        console.log("Saved location parse error:", error);
      }
    }

    // If no saved selected location, then use browser location
    if (!navigator.geolocation) {
      alert("Please Allow Location to continue");
      setLoadingLocation(false);
      setCity("Location unavailable");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const data = await res.json();

          const currentLocation: LocationData = {
            latitude,
            longitude,
            formattedAddress: data.display_name || "Current Location",
          };

          setLocation(currentLocation);
          setCity(
            data?.display_name ||
              data?.address?.city ||
              data?.address?.town ||
              data?.address?.village ||
              data?.address?.state_district ||
              "Your Location"
          );
        } catch (error) {
          console.log(error);

          setLocation({
            latitude,
            longitude,
            formattedAddress: "Current Location",
          });

          setCity("Current Location");
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.log(error);
        setLoadingLocation(false);
        setCity("Location blocked");
      }
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        isAuth,
        setUser,
        setIsAuth,
        setLoading,
        location,
        setLocation,
        loadingLocation,
        city,
        setCity,
        cart,
        fetchCart,
        subTotal,
        quauntity,
      }}
    >
      {children}
      <Toaster />
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }

  return context;
};