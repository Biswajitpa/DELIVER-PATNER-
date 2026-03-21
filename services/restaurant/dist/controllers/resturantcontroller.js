import cloudinary from "../config/cloudinary.js";
import Restaurant from "../models/Restaurant.js";
export const addRestaurant = async (req, res) => {
    try {
        const { name, phone, description, location } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                message: "Image is required",
            });
        }
        const uploadResult = await cloudinary.uploader.upload(file.path);
        const restaurant = await Restaurant.create({
            name,
            phone,
            description,
            location,
            image: uploadResult.secure_url,
        });
        return res.status(201).json({
            message: "Restaurant added successfully",
            restaurant,
        });
    }
    catch (error) {
        console.log("Add restaurant error:", error);
        return res.status(500).json({
            message: "Server error while adding restaurant",
        });
    }
};
