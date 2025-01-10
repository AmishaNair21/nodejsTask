// config/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
    // Validate environment variables
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email configuration is missing. Please check your environment variables.');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        },
        // Additional security options
        tls: {
            rejectUnauthorized: true
        }
    });
};

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `Node task Project <${process.env.EMAIL_USERNAME}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return info;

    } catch (error) {
        console.error('Email sending failed:', error);
        throw new Error('Failed to send email');
    }
};

// Email templates
export const getPasswordResetTemplate = (resetUrl) => {
    return `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <p>You requested a password reset for your account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                   Reset Password
                </a>
            </div>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; text-align: center;">
                This is an automated email, please do not reply.
            </p>
        </div>
    `;
};