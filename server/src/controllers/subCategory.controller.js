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


export const getSubCategoryController = async (request, response) => {
  try {
    const data = await SubCategory.find()
      .sort({ createdAt: -1 })
      .populate("category");
    return response.json({
      message: "Sub Category data",
      data: data,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const updateSubCategoryController = async (request, response) => {
  try {
    const { _id, name, image, category } = request.body;

    const checkSub = await SubCategory.findById(_id);

    if (!checkSub) {
      return response.status(400).json({
        message: "Check your _id",
        error: true,
        success: false,
      });
    }

    const updateSubCategory = await SubCategory.findByIdAndUpdate(_id, {
      name,
      image,
      category,
    });

    return response.json({
      message: "Updated Successfully",
      data: updateSubCategory,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export const deleteSubCategoryController = async (request, response) => {
  try {
    const { _id } = request.body;
    console.log("Id", _id);
    const deleteSub = await SubCategory.findByIdAndDelete(_id);

    return response.json({
      message: "Delete successfully",
      data: deleteSub,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export { addSubCategoryController };
