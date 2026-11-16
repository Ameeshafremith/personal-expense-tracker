
import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export const profilePictureUpload = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    upload.single("profilePicture")(req, res, async (error) => {
        if (error) {
            const isTooLarge =
                error instanceof multer.MulterError &&
                error.code === "LIMIT_FILE_SIZE";

            res.status(isTooLarge ? 413 : 400).json({
                success: false,
                message: isTooLarge
                    ? "Image size must not exceed 5 MB."
                    : error.message || "Invalid image upload.",
            });

            return;
        }

        if (!req.file) {
            res.status(400).json({
                success: false,
                message: "Please select an image.",
            });
            return;
        }

        try {
            const detectedType = await fileTypeFromBuffer(req.file.buffer);

            if (
                !detectedType ||
                !allowedMimeTypes.includes(detectedType.mime)
            ) {
                res.status(400).json({
                    success: false,
                    message: "Only valid JPG, PNG and WEBP images are allowed.",
                });
                return;
            }

            next();
        } catch {
            res.status(400).json({
                success: false,
                message: "Unable to validate the uploaded image.",
            });
        }
    });
};
