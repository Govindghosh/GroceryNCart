import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises"; // use promise-based API

// =============================
// Cloudinary Config
// =============================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =============================
// Helper: Extract publicId & resource type
// =============================
const extractPublicIdAndType = (url) => {
  if (!url) throw new Error("Invalid URL: Missing");

  const parts = url.split("/");
  const fileWithExt = parts.pop();
  const publicId = fileWithExt.split(".")[0];

  const fileType = fileWithExt.split(".").pop().toLowerCase();
  const isVideo = ["mp4", "mov", "avi", "mkv"].includes(fileType);

  return {
    publicId,
    resourceType: isVideo ? "video" : "image",
  };
};

// =============================
// Upload to Cloudinary
// =============================
export const uploadOnCloudinary = async (localFilePath, folder = "GroceryNCart") => {
  if (!localFilePath) {
    console.warn("[Cloudinary Upload] No file path provided");
    return null;
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

    console.log(`[Cloudinary Upload] ✅ File uploaded to: ${response.secure_url}`);

    // Remove local file safely
    try {
      await fs.unlink(localFilePath);
    } catch (cleanupErr) {
      console.error("[Cloudinary Upload] ⚠️ Failed to cleanup local file:", cleanupErr);
    }

    return response;
  } catch (error) {
    console.error("[Cloudinary Upload] ❌ Upload failed:", error.message);

    // Attempt cleanup even on failure
    try {
      await fs.unlink(localFilePath);
    } catch {
      /* ignore */
    }

    return null;
  }
};

// =============================
// Delete from Cloudinary
// =============================
export const deleteOnCloudinary = async (url) => {
  if (!url) {
    console.warn("[Cloudinary Delete] No URL provided");
    return null;
  }

  try {
    const { publicId, resourceType } = extractPublicIdAndType(url);

    const response = await cloudinary.uploader.destroy(publicId, {
      type: "upload",
      resource_type: resourceType,
    });

    if (response.result === "ok") {
      console.log(`[Cloudinary Delete] 🗑️ Successfully deleted: ${publicId}`);
    } else {
      console.warn(`[Cloudinary Delete] ⚠️ Unexpected response:`, response);
    }

    return response;
  } catch (error) {
    console.error("[Cloudinary Delete] ❌ Delete failed:", error.message);
    return null;
  }
};
