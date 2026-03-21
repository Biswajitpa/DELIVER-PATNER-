import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { restaurantService } from "../main";
import L from "leaflet";
import { LuLocateFixed } from "react-icons/lu";
import { BiLoader, BiPlus, BiTrash } from "react-icons/bi";
import { useAppData } from "../context/AppContext";

// Fix leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: string | number;
  latitude: number;
  longitude: number;
}

const LocationPicker = ({
  setLocation,
}: {
  setLocation: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      setLocation(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
};

const ChangeMapView = ({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.flyTo([latitude, longitude], 16, { animate: true });
    }
  }, [latitude, longitude, map]);

  return null;
};

const LocateMeButton = ({
  onLocate,
}: {
  onLocate: (lat: number, lng: number) => void;
}) => {
  const map = useMap();

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], 16, { animate: true });
        onLocate(latitude, longitude);
      },
      () => toast.error("Location permission denied"),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <button
      type="button"
      onClick={locateUser}
      className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow hover:bg-gray-100"
    >
      <LuLocateFixed size={16} />
      Use current location
    </button>
  );
};

const AddAddressPage = () => {
  const { setLocation: setAppLocation, setCity } = useAppData();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [mobile, setMobile] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const fetchFormattedAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
          lat
        )}&lon=${encodeURIComponent(lng)}&addressdetails=1&zoom=18`,
        {
          headers: {
            Accept: "application/json",
            "Accept-Language": "en",
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data?.display_name) {
        setFormattedAddress(data.display_name);
      } else {
        setFormattedAddress("");
        toast.error("Address not found", { id: "fetch-address-error" });
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setFormattedAddress("");
      toast.error("Failed to fetch address", { id: "fetch-address-error" });
    }
  };

  const setLocation = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchFormattedAddress(lat, lng);
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get(`${restaurantService}/api/address/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setAddresses(data || []);
    } catch (error) {
      console.error("Fetch addresses error:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const addAddress = async () => {
    if (
      !mobile.trim() ||
      !formattedAddress.trim() ||
      latitude === null ||
      longitude === null
    ) {
      toast.error("Please select location on map");
      return;
    }

    if (mobile.length !== 10) {
      toast.error("Please enter valid 10-digit mobile number");
      return;
    }

    try {
      setAdding(true);

      await axios.post(
        `${restaurantService}/api/address/new`,
        {
          formattedAddress,
          mobile,
          latitude,
          longitude,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Address added");
      setMobile("");
      setFormattedAddress("");
      setLatitude(null);
      setLongitude(null);
      await fetchAddresses();
    } catch (error: any) {
      console.error("Add address error:", error);
      toast.error(error?.response?.data?.message || "Failed");
    } finally {
      setAdding(false);
    }
  };

  const deleteAddress = async (id: string) => {
    if (!window.confirm("Delete this address?")) return;

    try {
      setDeletingId(id);

      await axios.delete(`${restaurantService}/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Address deleted");
      await fetchAddresses();
    } catch (error) {
      console.error("Delete address error:", error);
      toast.error("Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const selectSavedAddress = (addr: Address) => {
    const selectedLocation = {
      latitude: Number(addr.latitude),
      longitude: Number(addr.longitude),
      formattedAddress: addr.formattedAddress,
    };

    setLatitude(selectedLocation.latitude);
    setLongitude(selectedLocation.longitude);
    setFormattedAddress(selectedLocation.formattedAddress);

    setAppLocation(selectedLocation);
    setCity(selectedLocation.formattedAddress);

    localStorage.setItem("selectedLocation", JSON.stringify(selectedLocation));
    localStorage.setItem("selectedCity", selectedLocation.formattedAddress);

    toast.success("Address selected");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Select Delivery Address</h1>

      <div className="relative h-[400px] w-full overflow-hidden rounded-lg border">
        <MapContainer
          center={[latitude ?? 28.6139, longitude ?? 77.209]}
          zoom={13}
          className="h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <LocationPicker setLocation={setLocation} />
          <LocateMeButton onLocate={setLocation} />
          <ChangeMapView latitude={latitude} longitude={longitude} />

          {latitude !== null && longitude !== null && (
            <Marker position={[latitude, longitude]} />
          )}
        </MapContainer>
      </div>

      {formattedAddress && (
        <div className="rounded-lg border bg-green-50 p-3 text-sm">
          📍 {formattedAddress}
        </div>
      )}

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="Mobile number"
        value={mobile}
        onChange={(e) => {
          const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
          setMobile(onlyNumbers.slice(0, 10));
        }}
        className="w-full rounded-lg border px-4 py-2"
      />

      <button
        disabled={adding}
        onClick={addAddress}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#E23744] px-4 py-3 text-white hover:bg-[#d32f3a] disabled:opacity-50"
      >
        {adding ? <BiLoader className="animate-spin" /> : <BiPlus />}
        Save Address
      </button>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Saved Addresses</h2>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-500">No addresses saved</p>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr._id}
              className="flex items-center justify-between rounded-lg border bg-white p-3"
            >
              <div
                onClick={() => selectSavedAddress(addr)}
                className="cursor-pointer"
              >
                <p className="text-sm font-medium">{addr.formattedAddress}</p>
                <p className="text-xs text-gray-500">📞 {addr.mobile}</p>
                <p className="mt-1 text-xs text-blue-600">
                  Click to use this address
                </p>
              </div>

              <button
                onClick={() => deleteAddress(addr._id)}
                disabled={deletingId === addr._id}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {deletingId === addr._id ? (
                  <BiLoader size={16} className="animate-spin" />
                ) : (
                  <BiTrash size={16} />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AddAddressPage;