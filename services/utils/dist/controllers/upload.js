import cloudinary from "../config/cloudinary.js";
export const uploadImage = async (req, res) => {
    try {
        const { buffer } = req.body;
        if (!buffer) {
            return res.status(400).json({
                message: "Image buffer is required",
            });
        }
        const result = await cloudinary.uploader.upload(buffer);
        return res.status(200).json({
            message: "Image uploaded successfully",
            url: result.secure_url,
        });
    }
    catch (error) {
        console.log("Upload image error:", error);
        return res.status(500).json({
            message: "Failed to upload image",
        });
    }
};
