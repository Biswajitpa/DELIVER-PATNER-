import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Restaurant from "../models/Restaurant.js";
import jwt from "jsonwebtoken";

export const addRestraunt = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const existingRestaunrant = await Restaurant.findOne({
    ownerId: user._id,
  });

  if (existingRestaunrant) {
    return res.status(400).json({
      message: "You already have a restaurant",
    });
  }

  const { name, description, latitude, longitude, formattedAddress, phone } =
    req.body;

  if (!name || !latitude || !longitude || !phone || !description) {
    return res.status(400).json({
      message: "Please give all details",
    });
  }

  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "Please give image",
    });
  }

  const fileBuffer = getBuffer(file);

  if (!fileBuffer || !fileBuffer.content) {
    return res.status(500).json({
      message: "Failed to create file buffer",
    });
  }

  let uploadResult;

  try {
    const response = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      }
    );

    uploadResult = response.data;
  } catch (error: any) {
    console.log(
      "Restaurant image upload error:",
      error?.response?.data || error.message
    );

    return res.status(500).json({
      message:
        error?.response?.data?.message || "Failed to upload restaurant image",
    });
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      message: "Invalid latitude or longitude",
    });
  }

  const restaurant = await Restaurant.create({
    name,
    description,
    phone,
    image: uploadResult.url,
    ownerId: user._id,
    autoLocation: {
      type: "Point",
      coordinates: [lng, lat],
      formattedAddress,
    },
    isVerified: false,
    isOpen: false,
  });

  return res.status(201).json({
    message: "Restaurant created successfully",
    restaurant,
  });
});

export const fetchMyRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.json({ restaurant: null });
    }

    if (!req.user.restaurantId) {
      const token = jwt.sign(
        {
          user: {
            ...req.user,
            restaurantId: restaurant._id,
          },
        },
        process.env.JWT_SEC as string,
        {
          expiresIn: "15d",
        }
      );

      return res.json({ restaurant, token });
    }

    return res.json({ restaurant });
  }
);

export const updateStatusRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({
        message: "Status must be boolean",
      });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      {
        ownerId: req.user._id,
      },
      { isOpen: status },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    return res.json({
      message: "Restaurant status Updated",
      restaurant,
    });
  }
);

export const updateRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const { name, description } = req.body;

    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: req.user._id },
      { name, description },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    return res.json({
      message: "Restaurant Updated",
      restaurant,
    });
  }
);

export const getNearbyRestaurant = TryCatch(async (req, res) => {
  const { search = "" } = req.query;

  const query: any = {
    isVerified: true,
    isOpen: true,
  };

  if (search && typeof search === "string") {
    query.name = { $regex: search, $options: "i" };
  }

  const restaurants = await Restaurant.find(query);

  return res.json({
    success: true,
    count: restaurants.length,
    restaurants,
  });
});

export const fetchSingleRestaurant = TryCatch(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  return res.json(restaurant);
});