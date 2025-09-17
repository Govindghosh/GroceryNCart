import sendEmail from '../config/sendEmail.js'
import User from '../models/user.model.js'
import { asyncHandler } from "../utils/asyncHandler.js";
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import {uploadOnCloudinary, deleteOnCloudinary, uploadBufferOnCloudinary} from '../utils/cloudinary.js'
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'


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
export async function updateUserDetails(request,response){
    try {
        const userId = request.userId //auth middleware
        const { name, email, mobile, password } = request.body 

        let hashPassword = ""

        if(password){
            const salt = await bcryptjs.genSalt(10)
            hashPassword = await bcryptjs.hash(password,salt)
        }

        const updateUser = await User.updateOne({ _id : userId},{
            ...(name && { name : name }),
            ...(email && { email : email }),
            ...(mobile && { mobile : mobile }),
            ...(password && { password : hashPassword })
        })

        return response.json({
            message : "Updated successfully",
            error : false,
            success : true,
            data : updateUser
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//forgot password not login
export async function forgotPasswordController(request,response) {
    try {
        const { email } = request.body 

        const user = await User.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const otp = generatedOtp()
        const expireTime = new Date() + 60 * 60 * 1000 // 1hr

        const update = await User.findByIdAndUpdate(user._id,{
            forgot_password_otp : otp,
            forgot_password_expiry : new Date(expireTime).toISOString()
        })

        await sendEmail({
            sendTo : email,
            subject : "Forgot password from GroceryNCart",
            html : forgotPasswordTemplate({
                name : user.name,
                otp : otp
            })
        })

        return response.json({
            message : "check your email",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//verify forgot password otp
export async function verifyForgotPasswordOtp(request,response){
    try {
        const { email , otp }  = request.body

        if(!email || !otp){
            return response.status(400).json({
                message : "Provide required field email, otp.",
                error : true,
                success : false
            })
        }

        const user = await User.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email not available",
                error : true,
                success : false
            })
        }

        const currentTime = new Date().toISOString()

        if(user.forgot_password_expiry < currentTime  ){
            return response.status(400).json({
                message : "Otp is expired",
                error : true,
                success : false
            })
        }

        if(otp !== user.forgot_password_otp){
            return response.status(400).json({
                message : "Invalid otp",
                error : true,
                success : false
            })
        }

        //if otp is not expired
        //otp === user.forgot_password_otp

        const updateUser = await User.findByIdAndUpdate(user?._id,{
            forgot_password_otp : "",
            forgot_password_expiry : ""
        })
        
        return response.json({
            message : "Verify otp successfully",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//reset the password
export async function resetpassword(request,response){
    try {
        const { email , newPassword, confirmPassword } = request.body 

        if(!email || !newPassword || !confirmPassword){
            return response.status(400).json({
                message : "provide required fields email, newPassword, confirmPassword"
            })
        }

        const user = await User.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "Email is not available",
                error : true,
                success : false
            })
        }

        if(newPassword !== confirmPassword){
            return response.status(400).json({
                message : "newPassword and confirmPassword must be same.",
                error : true,
                success : false,
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(newPassword,salt)

        const update = await User.findOneAndUpdate(user._id,{
            password : hashPassword
        })

        return response.json({
            message : "Password updated successfully.",
            error : false,
            success : true
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}


//refresh token controller
export async function refreshToken(request,response){
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1]  /// [ Bearer token]

        if(!refreshToken){
            return response.status(401).json({
                message : "Invalid token",
                error  : true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)

        if(!verifyToken){
            return response.status(401).json({
                message : "token is expired",
                error : true,
                success : false
            })
        }

        const userId = verifyToken?._id

        const newAccessToken = await generatedAccessToken(userId)

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message : "New Access token generated",
            error : false,
            success : true,
            data : {
                accessToken : newAccessToken
            }
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//get login user details
export async function userDetails(req, res) {
  try {
    // auth middleware sets req.user
    const user = req.user; // already populated by auth middleware

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    // Optionally select only needed fields
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      mobile: user.mobile,
      role: user.role,
      status: user.status,
      address_details: user.address_details,
    };

    return res.json({
      message: "User details",
      data: userData,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
      error: true,
      success: false,
    });
  }
}



export {
    loginController,
    logoutController,
    registerUserController,
    verifyEmailController,
    uploadAvatar
}