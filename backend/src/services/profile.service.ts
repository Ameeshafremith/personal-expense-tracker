import User from "../models/user.model.js";

interface ProfileUpdateData {
    name?: string;
    email?: string;
    mobileNumber?: string;
    profilePicture?: string;
}

export const getUserProfile = async (userId: string) => {
    const user = await User.findById(userId).select(
        "name email role mobileNumber profilePicture financialYearStartMonth createdAt"
    );

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const updateUserProfile = async (
    userId: string,
    data: ProfileUpdateData
) => {
    const updateData: ProfileUpdateData = {};

    if (data.name !== undefined) {
        if (!data.name.trim()) {
            throw new Error("Name cannot be empty");
        }
        updateData.name = data.name.trim();
    }

    if (data.email !== undefined) {
        if (!data.email.trim()) {
            throw new Error("Email cannot be empty");
        }
        updateData.email = data.email.trim().toLowerCase();
    }

    if (data.mobileNumber !== undefined) {
        updateData.mobileNumber = data.mobileNumber.trim();
    }

    if (data.profilePicture !== undefined) {
        updateData.profilePicture = data.profilePicture.trim();
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).select(
        "name email role mobileNumber profilePicture financialYearStartMonth createdAt"
    );

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};