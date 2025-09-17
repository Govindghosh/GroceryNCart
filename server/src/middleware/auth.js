import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import  User  from "../models/user.model.js";

// Middleware function to verify JWT token
// Middleware function to verify JWT token
export const auth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Unauthorized request: No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found");
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }
});
export default auth;