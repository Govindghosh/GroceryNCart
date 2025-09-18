import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { useSelector } from "react-redux";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";

const UploadSubCategoryModel = ({ close, fetchData }) => {
  const [subCategoryData, setSubCategoryData] = useState({
    name: "",
    image: "",
    category: [],
  });

  const [loadingImage, setLoadingImage] = useState(false); // for image preview
  const [loading, setLoading] = useState(false); // 🔹 NEW state for form submit
  const allCategory = useSelector((state) => state.product.allCategory);

  // Handle name input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSubCategoryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Upload image with preview
  const handleUploadSubCategoryImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoadingImage(true);
    setSubCategoryData((prev) => ({
      ...prev,
      file, // raw file for backend
      image: URL.createObjectURL(file), // preview
    }));
    setLoadingImage(false);
  };

  // Remove selected category
  const handleRemoveCategorySelected = (categoryId) => {
    setSubCategoryData((prev) => ({
      ...prev,
      category: prev.category.filter((cat) => cat._id !== categoryId),
    }));
  };

  // Submit subcategory
  const handleSubmitSubCategory = async (e) => {
    e.preventDefault();

    if (!subCategoryData.name || !subCategoryData.category[0]) {
      toast.error("Name and Category are required");
      return;
    }

    try {
      setLoading(true); // 🔹 start loading

      const formData = new FormData();
      formData.append("name", subCategoryData.name);
      formData.append(
        "category",
        JSON.stringify(subCategoryData.category.map((c) => c._id))
      );

      if (subCategoryData.file) {
        formData.append("image", subCategoryData.file);
      }

      const response = await Axios.post(
        SummaryApi.createSubCategory.url,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success(responseData.message);
        close?.();
        fetchData?.();
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false); // 🔹 stop loading
    }
  };

  return (
    <section className="fixed top-0 right-0 bottom-0 left-0 bg-neutral-800 bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white p-4 rounded">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-semibold">Add Sub Category</h1>
          <button onClick={close}>
            <IoClose size={25} />
          </button>
        </div>

        <form className="my-3 grid gap-3" onSubmit={handleSubmitSubCategory}>
          {/* Name */}
          <div className="grid gap-1">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              value={subCategoryData.name}
              onChange={handleChange}
              className="p-3 bg-blue-50 border outline-none focus-within:border-primary-200 rounded"
            />
          </div>

          {/* Image */}
          <div className="grid gap-1">
            <p>Image</p>
            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="border h-36 w-full lg:w-36 bg-blue-50 flex items-center justify-center">
                {!subCategoryData.image ? (
                  <p className="text-sm text-neutral-400">No Image</p>
                ) : (
                  <img
                    alt="subCategory"
                    src={subCategoryData.image}
                    className="w-full h-full object-scale-down"
                  />
                )}
              </div>
              <label htmlFor="uploadSubCategoryImage">
                <div className="px-4 py-1 border border-primary-100 text-primary-200 rounded hover:bg-primary-200 hover:text-neutral-900 cursor-pointer">
                  {loadingImage ? "Uploading..." : "Upload Image"}
                </div>
                <input
                  type="file"
                  id="uploadSubCategoryImage"
                  className="hidden"
                  onChange={handleUploadSubCategoryImage}
                />
              </label>
            </div>
          </div>

          {/* Category selection */}
          <div className="grid gap-1">
            <label>Select Category</label>
            <div className="border focus-within:border-primary-200 rounded">
              {/* Selected categories */}
              <div className="flex flex-wrap gap-2">
                {subCategoryData.category.map((cat) => (
                  <p
                    key={cat._id + "selectedValue"}
                    className="bg-white shadow-md px-1 m-1 flex items-center gap-2"
                  >
                    {cat.name}
                    <div
                      className="cursor-pointer hover:text-red-600"
                      onClick={() => handleRemoveCategorySelected(cat._id)}
                    >
                      <IoClose size={20} />
                    </div>
                  </p>
                ))}
              </div>

              {/* Category dropdown */}
              <select
                className="w-full p-2 bg-transparent outline-none border"
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;

                  const categoryDetails = allCategory.find(
                    (el) => el._id === value
                  );
                  if (!categoryDetails) return;

                  // Prevent duplicate selection
                  if (subCategoryData.category.some((cat) => cat._id === value))
                    return;

                  setSubCategoryData((prev) => ({
                    ...prev,
                    category: [...prev.category, categoryDetails],
                  }));
                }}
              >
                <option value="">Select Category</option>
                {allCategory.map((category) => (
                  <option
                    value={category?._id}
                    key={category._id + "subcategory"}
                  >
                    {category?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || loadingImage}
            className={`px-4 py-2 border ${
              subCategoryData?.name &&
              subCategoryData?.image &&
              subCategoryData?.category[0]
                ? "bg-primary-200 hover:bg-primary-100"
                : "bg-gray-200"
            } font-semibold`}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default UploadSubCategoryModel;
