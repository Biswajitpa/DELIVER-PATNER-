import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import itemRoutes from "./routes/menuitem.js";
import cartRoutes from "./routes/cart.js";
import addressRoutes from "./routes/address.js";
import orderRoutes from "./routes/order.js";
import cors from "cors";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startPaymentConsumer } from "./config/payment.consumer.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderRoutes);
app.get("/", (_req, res) => {
    res.send("Restaurant service is working");
});
const startServer = async () => {
    try {
        await connectRabbitMQ();
        console.log("🐇 Connected to RabbitMQ");
        startPaymentConsumer();
        console.log("💳 Payment consumer started");
        await connectDB();
        console.log("🍃 Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Restaurant service is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.log("Error starting restaurant service:", error);
    }
};
startServer();
