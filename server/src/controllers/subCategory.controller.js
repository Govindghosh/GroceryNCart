import SubCategory from "../models/subCategory.model.js";
import {
  uploadOnCloudinary,
  deleteOnCloudinary,
  uploadBufferOnCloudinary,
} from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// subCategory.controller.js
const addSubCategoryController = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  const file = req.file;

  if (!name || !category || !file) {
    throw new ApiError(400, "Enter required fields");
  }

  // 🔹 Normalize category into an array of ObjectIds
  let parsedCategory = [];
  if (Array.isArray(category)) {
    parsedCategory = category;
  } else if (typeof category === "string") {
    try {
      parsedCategory = JSON.parse(category); // if JSON string (["id1","id2"])
    } catch {
      parsedCategory = [category]; // if plain string (single id)
    }
  } else {
    throw new ApiError(400, "Invalid category format");
  }

  // 🔹 Upload file to Cloudinary
  const uploadedImage = await uploadOnCloudinary(file.path, "subcategories");
  if (!uploadedImage?.secure_url) {
    throw new ApiError(500, "Image upload failed");
  }

  // 🔹 Create subcategory
  const subCategory = new SubCategory({
    name,
    category: parsedCategory,
    image: uploadedImage.secure_url,
  });

  const savedSubCategory = await subCategory.save();
  if (!savedSubCategory) {
    throw new ApiError(500, "Subcategory not created");
  }

  return res.json({
    message: "Subcategory created successfully",
    data: savedSubCategory,
    success: true,
    error: false,
  });
});

const getSubCategoryController = asyncHandler(async (req, res) => {
  const subCategories = await SubCategory.find()
    .sort({ createdAt: -1 })
    .populate("category", "name image"); // only return required fields

  if (!subCategories || subCategories.length === 0) {
    throw new ApiError(404, "No subcategories found");
  }

  return res.json({
    message: "Subcategories fetched successfully",
    data: subCategories,
    success: true,
    error: false,
  });
});

const updateSubCategoryController = asyncHandler(async (req, res) => {
  const { _id, name, category } = req.body;
  const file = req.file;

  if (!_id) throw new ApiError(400, "Subcategory ID is required");

  // Fetch existing subcategory
  const subCategory = await SubCategory.findById(_id);
  if (!subCategory) throw new ApiError(404, "Subcategory not found");

  const updateFields = {};
  if (name) updateFields.name = name;

  // Handle category (ensure it's always array of ObjectIds)
  if (category) {
    try {
      if (typeof category === "string") {
        updateFields.category = JSON.parse(category);
      } else if (Array.isArray(category)) {
        updateFields.category = category;
      } else {
        throw new Error("Invalid category format");
      }
    } catch (err) {
      throw new ApiError(
        400,
        "Invalid category format. Must be array of ObjectIds"
      );
    }
  }

  // If a new image is uploaded
  if (file) {
    // Delete old image from Cloudinary if it exists
    if (subCategory.image) {
      await deleteOnCloudinary(subCategory.image);
    }

    const uploadedImage = await uploadOnCloudinary(file.path, "subcategories");
    updateFields.image = uploadedImage.url;
  }

  const updatedSubCategory = await SubCategory.findByIdAndUpdate(
    _id,
    updateFields,
    { new: true }
  ).populate("category", "name image");

  return res.json({
    message: "Subcategory updated successfully",
    success: true,
    error: false,
    data: updatedSubCategory,
  });
});

const deleteSubCategoryController = asyncHandler(async (req, res) => {
  const { _id } = req.body;

  if (!_id) throw new ApiError(400, "Subcategory ID is required");

  const subCategory = await SubCategory.findById(_id);
  if (!subCategory) throw new ApiError(404, "Subcategory not found");

  // Delete image from Cloudinary if exists
  if (subCategory.image) {
    await deleteOnCloudinary(subCategory.image);
  }

  // Delete subcategory from DB
  await SubCategory.findByIdAndDelete(_id);

  return res.json({
    message: "Subcategory deleted successfully",
    data: subCategory,
    error: false,
    success: true,
  });
});

export {
  addSubCategoryController,
  getSubCategoryController,
  updateSubCategoryController,
  deleteSubCategoryController
};
