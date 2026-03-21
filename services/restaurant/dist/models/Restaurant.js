import mongoose, { Schema } from "mongoose";
const schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: "",
    },
    image: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    ownerId: {
        type: String,
        default: "",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    autoLocation: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
        formattedAddress: {
            type: String,
            required: true,
        },
    },
    isOpen: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
schema.index({ autoLocation: "2dsphere" });
const Restaurant = mongoose.model("Restaurant", schema);
export default Restaurant;
