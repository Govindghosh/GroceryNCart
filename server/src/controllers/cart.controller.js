import CartProduct from "../models/cartproduct.model.js";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const addToCartItemController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({
      message: "Provide productId",
      error: true,
      success: false,
    });
  }

  // Check if item already exists in cart
  const existingItem = await CartProduct.findOne({ userId, productId });
  if (existingItem) {
    return res.status(400).json({
      message: "Item already in cart",
      error: true,
      success: false,
    });
  }

  // Add new item to cart
  const cartItem = new CartProduct({
    quantity: 1,
    userId,
    productId,
  });
  const savedItem = await cartItem.save();

  // Update user's shopping_cart array
  await User.updateOne(
    { _id: userId },
    { $push: { shopping_cart: productId } }
  );

  return res.json({
    message: "Item added successfully",
    data: savedItem,
    error: false,
    success: true,
  });
});

const getCartItemController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from auth middleware

  const cartItems = await CartProduct.find({ userId }).populate('productId');

  return res.json({
    message: "Cart items fetched successfully",
    data: cartItems,
    error: false,
    success: true,
  });
});

const updateCartItemQtyController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { _id, qty } = req.body;

  if (!_id || qty == null) {
    return res.status(400).json({
      message: "Provide _id and qty",
      error: true,
      success: false,
    });
  }

  const updatedCartItem = await CartProduct.updateOne(
    { _id, userId },
    { quantity: qty }
  );

  return res.json({
    message: "Cart item updated successfully",
    data: updatedCartItem,
    error: false,
    success: true,
  });
});

const deleteCartItemQtyController = asyncHandler(async (req, res) => {
  const userId = req.user._id; // from auth middleware
  const { _id } = req.body;

  if (!_id) {
    return res.status(400).json({
      message: "Provide _id",
      error: true,
      success: false,
    });
  }

  const deletedItem = await CartProduct.deleteOne({ _id, userId });

  return res.json({
    message: "Item removed successfully",
    data: deletedItem,
    error: false,
    success: true,
  });
});

export {
    addToCartItemController,
    getCartItemController,
    updateCartItemQtyController,
    deleteCartItemQtyController
}