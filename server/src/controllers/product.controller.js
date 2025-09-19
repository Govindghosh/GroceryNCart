import Product from "../models/product.model.js";
import {
  uploadOnCloudinary,
  deleteOnCloudinary,
  uploadBufferOnCloudinary,
} from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const createProductController = asyncHandler(async (req, res) => {
  const {
    name,
    category,
    subCategory,
    unit,
    stock,
    price,
    discount,
    description,
    more_details,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !req.files?.length ||
    !category ||
    !subCategory ||
    !unit ||
    !price ||
    !description
  ) {
    return res.status(400).json({
      message: "Enter required fields",
      error: true,
      success: false,
    });
  }

  // Upload images to Cloudinary
  const uploadedImages = [];
  for (const file of req.files) {
    const result = await uploadOnCloudinary(file.path, "products"); // second param is folder name in Cloudinary
    uploadedImages.push(result.secure_url);
  }

  const product = new Product({
    name,
    image: uploadedImages,
    category,
    subCategory,
    unit,
    stock,
    price,
    discount,
    description,
    more_details,
  });

  const saveProduct = await product.save();

  return res.status(201).json({
    message: "Product Created Successfully",
    data: saveProduct,
    error: false,
    success: true,
  });
});

const getProductController = asyncHandler(async (req, res) => {
  let { page, limit, search } = req.body;

  page = Number(page) || 1;
  limit = Number(limit) || 10;

  const query = search
    ? {
        $text: {
          $search: search,
        },
      }
    : {};

  const skip = (page - 1) * limit;

  const [data, totalCount] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category subCategory"),
    Product.countDocuments(query),
  ]);

  return res.json({
    message: "Product data",
    error: false,
    success: true,
    totalCount,
    totalNoPage: Math.ceil(totalCount / limit),
    data,
  });
});

const getProductByCategory = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      message: "Provide category id",
      error: true,
      success: false,
    });
  }

  // Ensure id is always an array for $in
  const categoryIds = Array.isArray(id) ? id : [id];

  const products = await Product.find({
    category: { $in: categoryIds },
  })
    .limit(15)
    .populate("category subCategory");

  return res.json({
    message: "Category product list",
    data: products,
    error: false,
    success: true,
  });
});

const getProductByCategoryAndSubCategory = asyncHandler(async (req, res) => {
  let { categoryId, subCategoryId, page, limit } = req.body;

  if (!categoryId || !subCategoryId) {
    return res.status(400).json({
      message: "Provide categoryId and subCategoryId",
      error: true,
      success: false,
    });
  }

  page = Number(page) || 1;
  limit = Number(limit) || 10;

  // Ensure ids are arrays
  const categoryIds = Array.isArray(categoryId) ? categoryId : [categoryId];
  const subCategoryIds = Array.isArray(subCategoryId) ? subCategoryId : [subCategoryId];

  const query = {
    category: { $in: categoryIds },
    subCategory: { $in: subCategoryIds },
  };

  const skip = (page - 1) * limit;

  const [data, dataCount] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category subCategory"),
    Product.countDocuments(query),
  ]);

  return res.json({
    message: "Product list",
    data,
    totalCount: dataCount,
    totalPages: Math.ceil(dataCount / limit),
    currentPage: page,
    limit,
    success: true,
    error: false,
  });
});

const getProductDetails = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({
      message: "Product ID is required",
      error: true,
      success: false,
    });
  }

  const product = await Product.findById(productId).populate("category subCategory");

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
      error: true,
      success: false,
    });
  }

  return res.json({
    message: "Product details",
    data: product,
    error: false,
    success: true,
  });
});

//update product
const updateProductDetails = asyncHandler(async (req, res) => {
  const { _id, ...updateData } = req.body;

  if (!_id) {
    return res.status(400).json({
      message: "Provide product _id",
      error: true,
      success: false,
    });
  }

  const product = await Product.findById(_id);
  if (!product) {
    return res.status(404).json({
      message: "Product not found",
      error: true,
      success: false,
    });
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    _id,
    updateData,
    { new: true } // ✅ returns the updated document
  ).populate("category subCategory");

  return res.json({
    message: "Updated successfully",
    data: updatedProduct,
    error: false,
    success: true,
  });
});

// search product with $text (requires text index)
const searchProduct = asyncHandler(async (req, res) => {
  let { search, page, limit } = req.body;

  page = Number(page) || 1;
  limit = Number(limit) || 10;

  const query = search
    ? { $text: { $search: search } } // works only if text index exists
    : {};

  const skip = (page - 1) * limit;

  const [data, dataCount] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category subCategory"),
    Product.countDocuments(query),
  ]);

  return res.json({
    message: "Product data",
    error: false,
    success: true,
    data,
    totalCount: dataCount,
    totalPages: Math.ceil(dataCount / limit),
    currentPage: page,
    limit,
  });
});

//delete product
const deleteProductDetails = asyncHandler(async (req, res) => {
  const { _id } = req.body;

  if (!_id) {
    throw new ApiError(400, "Product ID (_id) is required");
  }

  // Find product first
  const product = await Product.findById(_id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // Delete images from Cloudinary if they exist
  if (Array.isArray(product.image) && product.image.length > 0) {
    for (const imgUrl of product.image) {
      try {
        await deleteOnCloudinary(imgUrl); // ✅ pass full URL
      } catch (err) {
        console.warn("Failed to delete image:", imgUrl, err.message);
      }
    }
  }

  // Delete product from DB
  await Product.deleteOne({ _id });

  return res.json({
    message: "Product deleted successfully",
    error: false,
    success: true,
  });
});

export {
  createProductController,
  getProductController,
  getProductByCategory,
  getProductByCategoryAndSubCategory,
  getProductDetails,
  updateProductDetails,
  deleteProductDetails,
  searchProduct,
};
