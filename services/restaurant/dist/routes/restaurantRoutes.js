import express from "express";
import { addRestaurant } from "../controllers/restaurantController.js";
import upload from "../middlewares/upload.js";
import { isAuth } from "../middlewares/isAuth.js";
const router = express.Router();
router.post("/add", isAuth, upload.single("image"), addRestaurant);
export default router;
