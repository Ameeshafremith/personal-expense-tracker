
import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
        throw new Error(
            "MONGODB_URI is missing from environment variables"
        );
    }

    try {
        await mongoose.connect(mongoURI);
        console.log("MongoDB connected successfully!");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
};

export default connectDB;
