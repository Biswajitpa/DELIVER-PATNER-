import { Response } from "express";
import cloudinary from "../config/cloudinary.js";
import Restaurant from "../models/Restaurant.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";

export const addRestaurant = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      name,
      phone,
      description,
      location,
      latitude,
      longitude,
      formattedAddress,
    } = req.body;

    const file = req.file as Express.Multer.File;

    if (!file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!name || !phone || !description) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const finalAddress =
      formattedAddress || location || "Location unavailable";

    if (!latitude || !longitude) {
      return res.status(400).json({
        message: "Latitude and longitude are required",
      });
    }

    const uploadResult = await cloudinary.uploader.upload(file.path);

    const restaurant = await Restaurant.create({
      name,
      phone,
      description,
      image: uploadResult.secure_url,
      ownerId: req.user._id,
      isVerified: false,
      isOpen: false,
      autoLocation: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
        formattedAddress: finalAddress,
      },
    });

    return res.status(201).json({
      message: "Restaurant added successfully",
      restaurant,
    });
  } catch (error) {
    console.log("Add restaurant error:", error);

    return res.status(500).json({
      message: "Server error while adding restaurant",
    });
  }
};