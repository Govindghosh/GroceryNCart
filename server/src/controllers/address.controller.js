import Address from "../models/address.model.js";
import User from "../models/user.model.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";


const addAddressController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from middleware
  console.log("User ID:", userId); // Debugging line
  const { address_line, city, state, pincode, country, mobile } = req.body;

  if (!address_line || !city || !state || !pincode || !country || !mobile) {
    return res.status(400).json({
      message: "All address fields are required",
      error: true,
      success: false,
    });
  }

  // Create new address
  const createAddress = new Address({
    address_line,
    city,
    state,
    country,
    pincode,
    mobile,
    userId,
  });

  const saveAddress = await createAddress.save();

  // Push reference into user model
  await User.findByIdAndUpdate(userId, {
    $push: { address_details: saveAddress._id },
  });

  return res.json({
    message: "Address created successfully",
    error: false,
    success: true,
    data: saveAddress,
  });
});


const getAddressController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from middleware auth

  const addresses = await Address.find({ userId }).sort({ createdAt: -1 });

  return res.json({
    data: addresses,
    message: "List of addresses",
    error: false,
    success: true,
  });
});


const updateAddressController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from middleware auth
  const { _id, address_line, city, state, country, pincode, mobile } = req.body;

  if (!_id) {
    return res.status(400).json({
      message: "Provide address _id",
      error: true,
      success: false,
    });
  }

  const updateResult = await Address.updateOne(
    { _id, userId },
    {
      address_line,
      city,
      state,
      country,
      mobile,
      pincode,
    }
  );

  return res.json({
    message: "Address Updated",
    error: false,
    success: true,
    data: updateResult,
  });
});

const deleteAddressController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { _id } = req.body;

  if (!_id) {
    return res.status(400).json({
      message: "Provide address _id",
      error: true,
      success: false,
    });
  }

  const disableAddress = await Address.updateOne(
    { _id, userId },
    { status: false }
  );

  return res.json({
    message: "Address removed",
    error: false,
    success: true,
    data: disableAddress,
  });
});

export {
    addAddressController,
    getAddressController,
    updateAddressController,
    deleteAddressController
}