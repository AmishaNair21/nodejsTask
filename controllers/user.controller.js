import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import { sendEmail,getPasswordResetTemplate } from "../config/email.js";

export const register = async (req, res) => {
    try {

        const { email, username, password } = req.body;

        // Validate required fields
        if (!email || !username || !password) {
            return res.status(400).json({ 
                message: "Missing required fields",
                received: { email: !!email, username: !!username, password: !!password }
            });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        
        if (existingUser) {
            console.log('User already exists');
            return res.status(400).json({ 
                message: "User already registered",
            });
        }

        // Hash password with logging
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with logging
        console.log('Creating new user...');
        const newUser = await User.create({
            email,
            username,
            password: hashedPassword
        });

        console.log('User created successfully:', newUser._id);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
        });
    }
};

export const login = async (req, res) => {
    try {
       

        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                message: "Email and password are required" 
            });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const checkPassword = await bcrypt.compare(password, user.password);
        if (!checkPassword) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
         
        // Set token in cookies
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600000 // 1 hour
        });

      

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash the reset token and save to user document
        user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // Send email using the new configuration
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Request',
            html: getPasswordResetTemplate(resetUrl)
        });

        res.status(200).json({
            message: "Password reset link sent to email"
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ 
            message: "Error sending password reset email",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Find user with valid reset token
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user's password and clear reset token fields
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        console.error('Reset password error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: "Error resetting password" });
    }
};