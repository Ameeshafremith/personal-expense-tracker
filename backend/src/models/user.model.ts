
import { Schema, model } from "mongoose";

interface IUser {
    name: string;
    email: string;
    passwordHash: string;
    role: "user" | "admin";
    refreshTokenHash?: string;
    refreshTokenExpiresAt?: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        refreshTokenHash: {
            type: String,
            select: false
        },

        refreshTokenExpiresAt: {
            type: Date,
            select: false
        }
    },
    {
        timestamps: true
    }
);

const User = model<IUser>("User", userSchema);

export default User;
