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

  // Match public_id from cloudinary URL
  // Example: https://res.cloudinary.com/<cloud>/<resource_type>/upload/v123456/folder/file.png
  const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
  const match = url.match(regex);

  if (!match || !match[1]) {
    throw new Error("Invalid Cloudinary URL: Could not extract public_id");
  }

  const publicId = match[1]; // e.g., folder/file

  // Detect resource type from URL (default: image)
  let resourceType = "image";
  if (url.includes("/video/")) resourceType = "video";
  if (url.includes("/raw/")) resourceType = "raw";

  return { publicId, resourceType };
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

    // Cleanup local file
    try {
      await fs.unlink(localFilePath);
    } catch (cleanupErr) {
      console.error("[Cloudinary Upload] ⚠️ Failed to cleanup local file:", cleanupErr);
    }

    return response;
  } catch (error) {
    console.error("[Cloudinary Upload] ❌ Upload failed:", error.message);
    return null;
  }
};

// =============================
// Upload (from buffer)
// =============================
export const uploadBufferOnCloudinary = async (buffer, folder = "GroceryNCart") => {
  if (!buffer) {
    console.warn("[Cloudinary Upload] No buffer provided");
    return null;
  }

  try {
    const base64 = `data:image/png;base64,${buffer.toString("base64")}`;
    const response = await cloudinary.uploader.upload(base64, {
      resource_type: "auto",
      folder,
    });

    console.log(`[Cloudinary Upload] ✅ Buffer uploaded to: ${response.secure_url}`);
    return response;
  } catch (error) {
    console.error("[Cloudinary Upload] ❌ Buffer upload failed:", error.message);
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
