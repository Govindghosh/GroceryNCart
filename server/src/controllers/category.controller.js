import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import Category from "../models/category.model.js";
import SubCategory from "../models/subCategory.model.js";
import ProductModel from "../models/product.model.js";
import {uploadOnCloudinary, deleteOnCloudinary, uploadBufferOnCloudinary} from '../utils/cloudinary.js';

const addCategoryController = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const file = req.file;

  if (!name || !file) {
    throw new ApiError(400, "Enter required fields");
  }

  // Upload the file to Cloudinary (or wherever you store it)
  const uploadedImage = await uploadOnCloudinary(file.path, "category_images");
  console.log("uploadedImage", uploadedImage.url);

  const category = new Category({
    name,
    image: uploadedImage.url, // save Cloudinary URL
  });

  const savedCategory = await category.save();

  if (!savedCategory) {
    throw new ApiError(500, "Category not created");
  }

  return res.json({
    message: "Category added successfully",
    data: savedCategory,
    success: true,
    error: false,
  });
});

const getCategoryController = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });

  return res.json({
    message: "Categories fetched successfully",
    data: categories,
    success: true,
    error: false,
  });
});

const updateCategoryController = asyncHandler(async (req, res) => {
  const { _id, name } = req.body;
  const file = req.file;

  if (!_id) throw new ApiError(400, "Category ID is required");

  // Fetch existing category
  const category = await Category.findById(_id);
  if (!category) throw new ApiError(404, "Category not found");

  const updateFields = {};
  if (name) updateFields.name = name;

  // Handle new image upload
  if (file) {
    try {
      // Delete old image if exists
      if (category.image) {
        const publicId = category.image.split("/").pop().split(".")[0];
        await deleteOnCloudinary(publicId);
      }

      // Upload new image to Cloudinary
      const uploadedImage = await uploadOnCloudinary(file.path, "category_images");
      updateFields.image = uploadedImage.secure_url;
    } catch (err) {
      return res.status(500).json({ success: false, message: "Image upload failed", error: err.message });
    }
  }

  // Update category in DB
  const updatedCategory = await Category.findByIdAndUpdate(_id, updateFields, { new: true });

  return res.json({
    message: "Category updated successfully",
    success: true,
    error: false,
    data: updatedCategory,
  });
});

const deleteCategoryController = asyncHandler(async (req, res) => {
  const { _id } = req.body;

  if (!_id) throw new ApiError(400, "Category ID is required");

  // Find the category first
  const category = await Category.findById(_id);
  if (!category) throw new ApiError(404, "Category not found");

  // Check if category is in use
  const checkSubCategory = await SubCategory.countDocuments({ category: _id });
  const checkProduct = await ProductModel.countDocuments({ category: _id });

  if (checkSubCategory > 0 || checkProduct > 0) {
    throw new ApiError(400, "Category is already in use, cannot delete");
  }

  // Delete image from Cloudinary if it exists
  if (category.image) {
    await deleteOnCloudinary(category.image);
  }

  // Delete the category from DB
  await Category.deleteOne({ _id });

  return res.json({
    message: "Category deleted successfully",
    success: true,
    error: false,
  });
});

export {
    addCategoryController,
    getCategoryController,
    updateCategoryController,
    deleteCategoryController

}