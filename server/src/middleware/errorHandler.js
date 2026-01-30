import { ApiError } from "../utils/ApiError.js";

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON responses
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error:", err);

  // If it's an ApiError instance, use its properties
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      success: false,
      error: true,
      errors: err.errors,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: "Validation Error",
      success: false,
      error: true,
      errors,
    });
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} already exists`,
      success: false,
      error: true,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
      success: false,
      error: true,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
      success: false,
      error: true,
    });
  }

  // Default error response
  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
    success: false,
    error: true,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
