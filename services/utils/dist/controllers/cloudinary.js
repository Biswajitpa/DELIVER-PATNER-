import cloudinary from "cloudinary";
export const uploadFile = async (req, res) => {
    try {
        const { buffer } = req.body;
        if (!buffer) {
            return res.status(400).json({
                message: "Image buffer is required",
            });
        }
        const result = await cloudinary.v2.uploader.upload(buffer, {
            folder: "tomato",
        });
        return res.status(200).json({
            message: "Upload successful",
            url: result.secure_url,
        });
    }
    catch (error) {
        console.log("Upload error:", error);
        return res.status(500).json({
            message: "Upload failed",
        });
    }
};
