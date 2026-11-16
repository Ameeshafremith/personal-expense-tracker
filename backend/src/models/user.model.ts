
import { Schema, model } from "mongoose";

interface IUser {
    name: string;
    email: string;
    passwordHash: string;
    role: "user" | "admin";
    refreshTokenHash?: string;
    refreshTokenExpiresAt?: Date;
    financialYearStartMonth: number;
    mobileNumber?: string;
    profilePicture?: string;
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
        },

        financialYearStartMonth: {
            type: Number,
            required: true,
            min: 1,
            max: 12,
            default: 1
        },

        mobileNumber: {
            type: String,
            trim: true,
            maxlength: 20
        },
        profilePicture: {
            type: String,
            trim: true
        }

    },
    {
        timestamps: true
    }
);

const User = model<IUser>("User", userSchema);

export default User;
