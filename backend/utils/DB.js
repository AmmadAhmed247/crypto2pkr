import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()

export const connectDb=async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL);

        console.log("Mongo Db Connected");
    } catch (error) {
        console.error("Error while connecting the db!");
        process.exit(1);
    }
}

