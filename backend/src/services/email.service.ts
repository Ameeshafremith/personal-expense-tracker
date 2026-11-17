
const brevoApiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;

export const sendPasswordResetEmail = async (
    email: string,
    resetLink: string
): Promise<void> => {
    if (!brevoApiKey || !senderEmail) {
        throw new Error("Brevo email configuration is missing");
    }

    const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": brevoApiKey,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    name: "ExpenseFlow",
                    email: senderEmail,
                },
                to: [
                    {
                        email,
                    },
                ],
                subject: "Reset Your ExpenseFlow Password",
                textContent: `You requested a password reset.

Open the following link to reset your password:

${resetLink}

This link expires in 15 minutes.

If you did not request this, you can ignore this email.`,
                htmlContent: `
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
            }),
        }
    );

    if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Brevo email failed (${response.status}): ${errorDetails}`);
    }
};
