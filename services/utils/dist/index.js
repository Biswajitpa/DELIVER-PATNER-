import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import uploadRoutes from "./routes/cloudinary.js";
import paymentRoutes from "./routes/payment.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
const CLOUD_NAME = process.env.CLOUD_NAME;
const CLOUD_API_KEY = process.env.CLOUD_API_KEY;
const CLOUD_SECRET_KEY = process.env.CLOUD_SECRET_KEY;
if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_SECRET_KEY) {
    console.log("CLOUD_NAME:", CLOUD_NAME);
    console.log("CLOUD_API_KEY:", CLOUD_API_KEY);
    console.log("CLOUD_SECRET_KEY:", CLOUD_SECRET_KEY);
    throw new Error("Missing Cloudinary environment variables");
}
cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_SECRET_KEY,
});
app.use("/api", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.get("/", (_req, res) => {
    res.send("Utils service is running");
});
const startServer = async () => {
    try {
        await connectRabbitMQ();
        console.log("🐇 Connected to RabbitMQ");
        app.listen(PORT, () => {
            console.log(`Utils service is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.log("Error starting utils service:", error);
    }
};
startServer();
