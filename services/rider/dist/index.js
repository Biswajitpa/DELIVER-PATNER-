import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import riderRoutes from "./routes/rider.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOrderReadyConsumer } from "./config/orderReady.consumer.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5005;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/rider", riderRoutes);
app.get("/", (_req, res) => {
    res.send("Rider service is working");
});
const startServer = async () => {
    try {
        await connectRabbitMQ();
        console.log("🐇 Connected to RabbitMQ");
        startOrderReadyConsumer();
        console.log("📦 Order ready consumer started");
        await connectDB();
        console.log("🍃 Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`Rider service is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.log("Error starting rider service:", error);
    }
};
startServer();
