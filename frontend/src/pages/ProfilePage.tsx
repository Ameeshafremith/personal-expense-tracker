
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
    Camera,
    UserRound,
    Mail,
    Phone,
    LockKeyhole,
    Save,
    LoaderCircle,
    ShieldCheck,
} from "lucide-react";
import axios from "axios";

import api from "../services/api";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { updateAuthUser } from "../features/auth/authSlice";

interface ProfileData {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    role: "user" | "admin";
    mobileNumber?: string;
    profilePicture?: string;
    financialYearStartMonth?: number;
    createdAt?: string;
}

const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<ProfileData>({
        name: "",
        email: "",
        role: "user",
        mobileNumber: "",
        profilePicture: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const [profileMessage, setProfileMessage] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [profileError, setProfileError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/profile");
                const data: ProfileData = response.data.data;

                setProfile({
                    ...data,
                    mobileNumber: data.mobileNumber || "",
                    profilePicture: data.profilePicture || "",
                });

                dispatch(updateAuthUser({
                    name: data.name,
                    email: data.email,
                    mobileNumber: data.mobileNumber,
                    profilePicture: data.profilePicture,
                }));
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    setProfileError(
                        error.response?.data?.message ||
                        "Unable to load your profile."
                    );
                } else {
                    setProfileError("Unable to load your profile.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [dispatch]);

    const handleProfileChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = event.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setSaving(true);
        setProfileMessage("");
        setProfileError("");

        try {
            const response = await api.put("/profile", {
                name: profile.name,
                email: profile.email,
                mobileNumber: profile.mobileNumber,
            });

            const updatedProfile: ProfileData = response.data.data;

            setProfile((previous) => ({
                ...previous,
                ...updatedProfile,
                mobileNumber: updatedProfile.mobileNumber || "",
                profilePicture: updatedProfile.profilePicture || "",
            }));

            dispatch(updateAuthUser({
                name: updatedProfile.name,
                email: updatedProfile.email,
                mobileNumber: updatedProfile.mobileNumber,
                profilePicture: updatedProfile.profilePicture,
            }));

            setProfileMessage("Your profile has been updated successfully.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setProfileError(
                    error.response?.data?.message ||
                    "Failed to update your profile."
                );
            } else {
                setProfileError("Something went wrong.");
            }
        } finally {
            setSaving(false);
        }
    };

    
    const handlePictureChange = async (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setProfileMessage("");
        setProfileError("");

        // Identify the image using its MIME type or file extension.
        const extension = file.name.split(".").pop()?.toLowerCase();

        const extensionTypes: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            webp: "image/webp",
        };

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        const detectedType = allowedTypes.includes(file.type)
            ? file.type
            : extensionTypes[extension || ""];

        if (!detectedType) {
            setProfileError(
                "Please select a JPG, JPEG, PNG, or WEBP image."
            );
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setProfileError("Image size must not exceed 5MB.");
            event.target.value = "";
            return;
        }

        // Normalize the MIME type so Multer receives the expected type.
        const imageFile = new File(
            [file],
            file.name,
            { type: detectedType }
        );

        const formData = new FormData();
        formData.append("profilePicture", imageFile);

        setUploading(true);

        try {
            const response = await api.post("/profile/picture", formData);

            const updatedProfile: ProfileData = response.data.data;

            setProfile((previous) => ({
                ...previous,
                profilePicture: updatedProfile.profilePicture || "",
            }));

            dispatch(updateAuthUser({
                profilePicture: updatedProfile.profilePicture,
            }));

            setProfileMessage("Profile picture uploaded successfully.");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setProfileError(
                    error.response?.data?.message ||
                    "Failed to upload profile picture."
                );
            } else {
                setProfileError("Something went wrong during upload.");
            }
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };


    const handleChangePassword = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordError("");

        if (newPassword.length < 8) {
            setPasswordError("Your new password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirmation do not match.");
            return;
        }

        setChangingPassword(true);

        try {
            const response = await api.put("/profile/password", {
                currentPassword,
                newPassword,
            });

            setPasswordMessage(
                response.data.message || "Password changed successfully."
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setPasswordError(
                    error.response?.data?.message ||
                    "Failed to change password."
                );
            } else {
                setPasswordError("Something went wrong.");
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";

    const labelClass =
        "mb-2 block text-sm font-medium text-slate-300";

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center text-violet-400">
                <LoaderCircle className="mr-3 animate-spin" size={25} />
                Loading your profile...
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-8 text-white">

            {/* Page Heading */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    My Profile
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Manage your personal information and account security.
                </p>
            </div>

            {/* Profile Information Card */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#151c31] shadow-xl">

                <div className="border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-indigo-600/10 px-6 py-5">
                    <h2 className="text-lg font-semibold">
                        Personal Information
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                        Update your account details and profile picture.
                    </p>
                </div>

                <div className="p-6 md:p-8">

                    {/* Profile Picture */}
                    <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row">

                        <div className="relative">
                            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-violet-500/30 bg-gradient-to-br from-violet-600 to-indigo-700 text-4xl font-bold shadow-lg">
                                {profile.profilePicture ? (
                                    <img
                                        src={profile.profilePicture}
                                        alt="Profile"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    profile.name?.charAt(0).toUpperCase() || "U"
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#151c31] bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-50"
                                title="Change profile picture"
                            >
                                {uploading ? (
                                    <LoaderCircle size={17} className="animate-spin" />
                                ) : (
                                    <Camera size={17} />
                                )}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handlePictureChange}
                            />
                        </div>

                        <div className="text-center sm:text-left">
                            <h3 className="text-xl font-semibold">
                                {profile.name || user?.name || "User"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                {profile.email || user?.email}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                JPG, PNG or WEBP. Maximum size: 5MB.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-5">

                        <div className="grid gap-5 md:grid-cols-2">

                            <div>
                                <label className={labelClass}>
                                    Full Name
                                </label>
                                <div className="relative">
                                    <UserRound
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                    />
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleProfileChange}
                                        placeholder="Enter your full name"
                                        className={`${inputClass} pl-11`}
                                        required
                                        maxLength={100}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <Mail
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                    />
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                        placeholder="Enter your email"
                                        className={`${inputClass} pl-11`}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <Phone
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                                    />
                                    <input
                                        type="tel"
                                        name="mobileNumber"
                                        value={profile.mobileNumber || ""}
                                        onChange={handleProfileChange}
                                        placeholder="Enter your mobile number"
                                        className={`${inputClass} pl-11`}
                                        maxLength={20}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Account Role
                                </label>
                                <div className={`${inputClass} flex items-center gap-3`}>
                                    <ShieldCheck size={18} className="text-violet-400" />
                                    <span className="capitalize">
                                        {profile.role}
                                    </span>
                                </div>
                            </div>

                        </div>

                        {profileError && (
                            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                                {profileError}
                            </p>
                        )}

                        {profileMessage && (
                            <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                                {profileMessage}
                            </p>
                        )}

                        <div className="flex justify-end border-t border-white/10 pt-5">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? (
                                    <LoaderCircle size={17} className="animate-spin" />
                                ) : (
                                    <Save size={17} />
                                )}
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>

                    </form>
                </div>
            </section>

            {/* Change Password Card */}
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#151c31] shadow-xl">

                <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
                            <LockKeyhole size={21} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">
                                Change Password
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Keep your ExpenseFlow account secure.
                            </p>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleChangePassword}
                    className="space-y-5 p-6 md:p-8"
                >

                    <div className="grid gap-5 md:grid-cols-2">

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                placeholder="Enter your current password"
                                className={inputClass}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder="Enter your new password"
                                className={inputClass}
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Confirm your new password"
                                className={inputClass}
                                required
                                minLength={8}
                                autoComplete="new-password"
                            />
                        </div>

                    </div>

                    {passwordError && (
                        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {passwordError}
                        </p>
                    )}

                    {passwordMessage && (
                        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                            {passwordMessage}
                        </p>
                    )}

                    <div className="flex justify-end border-t border-white/10 pt-5">
                        <button
                            type="submit"
                            disabled={changingPassword}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {changingPassword ? (
                                <LoaderCircle size={17} className="animate-spin" />
                            ) : (
                                <LockKeyhole size={17} />
                            )}
                            {changingPassword ? "Updating..." : "Update Password"}
                        </button>
                    </div>

                </form>
            </section>

        </div>
    );
};

export default ProfilePage;
