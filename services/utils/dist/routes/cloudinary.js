import express from "express";
import cloudinary from "cloudinary";
const router = express.Router();
router.post("/upload", async (req, res) => {
    try {
        const { buffer } = req.body;
        if (!buffer) {
            return res.status(400).json({
                message: "Image buffer is required",
            });
        }
        const uploadResult = await cloudinary.v2.uploader.upload(buffer, {
            folder: "tomato",
        });
        return res.status(200).json({
            url: uploadResult.secure_url,
            message: "Image uploaded successfully",
        });
    }
    catch (error) {
        console.log("Cloudinary upload error:", error);
        return res.status(500).json({
            message: error?.message || "Failed to upload image",
        });
    }
});
export default router;
