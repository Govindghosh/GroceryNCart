import sendEmail from '../config/sendEmail.js'
import User from '../models/user.model.js'
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js';
import {uploadOnCloudinary, deleteOnCloudinary, uploadBufferOnCloudinary} from '../utils/cloudinary.js';
import generatedOtp from '../utils/generatedOtp.js';
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js';
import jwt from 'jsonwebtoken';


const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found while generating tokens");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
};

const registerUserController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Provide name, email, and password");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(400, "Email already registered");

  const newUser = new User({
    name,
    email,
    password,
  });

  const savedUser = await newUser.save();

  // Send verification email
  const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${savedUser._id}`;
  await sendEmail({
    sendTo: email,
    subject: "Verify your email for GroceryNCart",
    html: verifyEmailTemplate({ name, url: verifyEmailUrl }),
  });

  return res.status(201).json({
    message: "User registered successfully. Verification email sent.",
    success: true,
    error: false,
    data: savedUser,
  });
});

const verifyEmailController = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError(400, "Verification code is required");
  }

  const user = await User.findById(code);
  if (!user) throw new ApiError(400, "Invalid verification code");

  user.verify_email = true;
  await user.save({ validateBeforeSave: false });

  return res.json({
    message: "Email verification successful",
    success: true,
    error: false,
  });
});

//login controller
const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Provide email and password");
  }

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(400, "User not registered");
  if (user.status !== "Active") throw new ApiError(403, "Account not active");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  user.last_login_date = new Date();
  await user.save({ validateBeforeSave: false });

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);

  return res.status(200).json({
    message: "Login successful",
    success: true,
    error: false,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

//logout controller
const logoutController = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  await User.findByIdAndUpdate(userId, { refresh_token: "" });

  return res.json({
    message: "Logout successful",
    success: true,
    error: false,
  });
});


// upload user avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const image = req.file;

  if (!image) throw new ApiError(400, "No image provided");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Delete previous avatar
  if (user.avatar) {
    await deleteOnCloudinary(user.avatar);
  }

  // Upload new avatar (path OR buffer)
  let upload;
  if (image.path) {
    upload = await uploadOnCloudinary(image.path, "avatars");
  } else if (image.buffer) {
    upload = await uploadBufferOnCloudinary(image.buffer, "avatars");
  }

  if (!upload) throw new ApiError(500, "Cloudinary upload failed");

  user.avatar = upload.secure_url;
  await user.save({ validateBeforeSave: false });

  return res.json({
    message: "Profile avatar uploaded successfully",
    success: true,
    error: false,
    data: {
      _id: userId,
      avatar: upload.secure_url,
    },
  });
});

//update user details
const updateUserDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { name, email, mobile, password } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized request");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Check for email conflict if email is being changed
  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) throw new ApiError(400, "Email already in use");
    user.email = email;
  }

  if (name) user.name = name;
  if (mobile) user.mobile = mobile;

  // password hashing will be handled by pre-save hook
  if (password) user.password = password;

  const updatedUser = await user.save({ validateBeforeSave: true });

  return res.status(200).json({
    message: "User updated successfully",
    success: true,
    error: false,
    data: {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      mobile: updatedUser.mobile,
      role: updatedUser.role,
      status: updatedUser.status,
    },
  });
});

//forgot password not login
const forgotPasswordController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({
      message: "Email not registered",
      error: true,
      success: false,
    });
  }

  // Generate OTP + expiry (1 hour from now)
  const otp = generatedOtp();
  const expireTime = new Date(Date.now() + 60 * 60 * 1000);

  await User.findByIdAndUpdate(user._id, {
    forgot_password_otp: otp,
    forgot_password_expiry: expireTime,
  });

  // Send email
  await sendEmail({
    sendTo: email,
    subject: "Forgot Password - GroceryNCart",
    html: forgotPasswordTemplate({
      name: user.name,
      otp,
    }),
  });

  return res.json({
    message: "OTP sent to your email. Valid for 1 hour.",
    error: false,
    success: true,
  });
});

//verify forgot password otp
const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Provide required fields: email and otp.",
        error: true,
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Email not registered",
        error: true,
        success: false,
      });
    }

    // Compare expiry properly
    const currentTime = new Date();
    if (!user.forgot_password_expiry || user.forgot_password_expiry < currentTime) {
      return res.status(400).json({
        message: "OTP is expired",
        error: true,
        success: false,
      });
    }

    // Check OTP (cast to string for safety)
    if (String(otp) !== String(user.forgot_password_otp)) {
      return res.status(400).json({
        message: "Invalid OTP",
        error: true,
        success: false,
      });
    }

    // OTP is valid → clear OTP & expiry
    await User.findByIdAndUpdate(user._id, {
      forgot_password_otp: null,
      forgot_password_expiry: null,
    });

    return res.json({
      message: "OTP verified successfully",
      error: false,
      success: true,
      data: { userId: user._id }, // 👈 useful for reset password step
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
});

//reset the password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({
      message: "provide required fields email, newPassword, confirmPassword",
      error: true,
      success: false,
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      message: "Email is not available",
      error: true,
      success: false,
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      message: "newPassword and confirmPassword must be same.",
      error: true,
      success: false,
    });
  }

  // ✅ assign directly, pre-save hook will hash
  user.password = newPassword;
  user.forgot_password_otp = null;
  user.forgot_password_expiry = null;
  user.refreshToken = ""; // logout all devices

  await user.save();

  return res.json({
    message: "Password updated successfully. Please login again.",
    error: false,
    success: true,
  });
});

//refresh token controller
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.headers?.authorization?.split(" ")[1]; // Bearer token

  if (!refreshToken) {
    return res.status(401).json({
      message: "Invalid token",
      error: true,
      success: false,
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({
      message: "Token is expired or invalid",
      error: true,
      success: false,
    });
  }

  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({
      message: "Invalid token or user not found",
      error: true,
      success: false,
    });
  }

  // Generate new tokens (rotates refresh token)
  const { accessToken, refreshToken: newRefreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  // Set cookies
  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", newRefreshToken, cookieOptions);

  return res.json({
    message: "New access and refresh tokens generated",
    error: false,
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

//get login user details
const userDetails = asyncHandler(async (req, res) => {
  const user = req.user; // populated by auth middleware

  if (!user) {
    return res.status(404).json({
      message: "User not found",
      error: true,
      success: false,
    });
  }

  // Return only required fields
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    address_details: user.address_details,
  };

  return res.json({
    message: "User details fetched successfully",
    data: userData,
    error: false,
    success: true,
  });
});

export {
    loginController,
    logoutController,
    registerUserController,
    verifyEmailController,
    uploadAvatar,
    updateUserDetails,
    forgotPasswordController,
    verifyForgotPasswordOtp,
    resetPassword,
    refreshToken,
    userDetails
}