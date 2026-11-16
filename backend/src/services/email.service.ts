
import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD;

if (!emailUser || !emailPassword) {
    throw new Error("Email configuration is missing from .env");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPassword,
    },
});

export const sendPasswordResetEmail = async (
    email: string,
    resetLink: string
): Promise<void> => {
    await transporter.sendMail({
        from: `"ExpenseFlow" <${emailUser}>`,
        to: email,
        subject: "Reset Your ExpenseFlow Password",
        text: `You requested a password reset.

Open the following link to reset your password:

${resetLink}

This link expires in 15 minutes.

If you did not request this, you can ignore this email.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #10111d; color: white; border-radius: 12px;">
                <h2 style="color: #a78bfa;">ExpenseFlow</h2>
                <h3>Reset Your Password</h3>
                <p>We received a request to reset your ExpenseFlow password.</p>
                <p>Click the button below to continue:</p>
                <a href="${resetLink}"
                   style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px;">
                   Reset Password
                </a>
                <p style="margin-top: 25px;">This link expires in 15 minutes.</p>
                <p>If you did not request this, you can safely ignore this email.</p>
            </div>
        `,
    });
};
