import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { useSelector } from "react-redux";
import Axios from "../utils/Axios";
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";
import SummaryApi from "../common/SummaryApi";

const EditSubCategory = ({ close, data, fetchData }) => {
  const [subCategoryData, setSubCategoryData] = useState({
    _id: "",
    name: "",
    image: "",
    category: [],
    imageFile: null,
  });
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const allCategory = useSelector((state) => state.product?.allCategory || []);

  useEffect(() => {
    if (data) {
      setSubCategoryData({
        _id: data._id || "",
        name: data.name || "",
        image: data.image || "",
        category: data.category || [],
        imageFile: null,
      });
      setPreview(data.image || "");
    }
  }, [data]);

  if (!data) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSubCategoryData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadSubCategoryImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubCategoryData((prev) => ({ ...prev, imageFile: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveCategorySelected = (categoryId) => {
    setSubCategoryData((prev) => ({
      ...prev,
      category: prev.category.filter((cat) => cat._id !== categoryId),
    }));
  };

  const handleAddCategory = (e) => {
    const value = e.target.value;
    const categoryDetails = allCategory.find((el) => el._id === value);
    if (!categoryDetails) return;
    if (subCategoryData.category.some((cat) => cat._id === categoryDetails._id))
      return;
    setSubCategoryData((prev) => ({
      ...prev,
      category: [...prev.category, categoryDetails],
    }));
  };

  const handleSubmitSubCategory = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("_id", subCategoryData._id);
      formData.append("name", subCategoryData.name);
      if (subCategoryData.imageFile) formData.append("image", subCategoryData.imageFile);
      subCategoryData.category.forEach((cat) => formData.append("category[]", cat._id));

      const response = await Axios({
        ...SummaryApi.updateSubCategory,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const responseData = response?.data;
      if (responseData?.success) {
        toast.success(responseData.message || "Updated successfully");
        if (close) close();
        if (fetchData) fetchData();
      } else {
        toast.error(responseData?.message || "Update failed");
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Edit Sub Category</h1>
          <button onClick={close} className="text-gray-600 hover:text-gray-900">
            <IoClose size={28} />
          </button>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmitSubCategory}>
          {/* Name */}
          <div className="grid gap-1">
            <label className="font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={subCategoryData.name}
              onChange={handleChange}
              placeholder="Enter subcategory name"
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 bg-blue-50"
            />
          </div>

          {/* Image */}
          <div className="grid gap-1">
            <label className="font-medium">Image</label>
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="border border-gray-200 h-36 w-full lg:w-36 bg-blue-50 rounded-lg flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-gray-400 text-sm">No Image</p>
                )}
              </div>
              <label
                htmlFor="uploadSubCategoryImage"
                className="px-5 py-2 bg-primary-200 text-white font-medium rounded-lg hover:bg-primary-300 cursor-pointer transition"
              >
                Upload Image
              </label>
              <input
                type="file"
                id="uploadSubCategoryImage"
                className="hidden"
                onChange={handleUploadSubCategoryImage}
              />
            </div>
          </div>

          {/* Categories */}
          <div className="grid gap-1">
            <label className="font-medium">Select Categories</label>
            <div className="border border-gray-300 rounded-lg p-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {subCategoryData.category.map((cat) => (
                  <span
                    key={cat._id}
                    className="flex items-center gap-1 bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm font-medium"
                  >
                    {cat.name}
                    <IoClose
                      size={16}
                      className="cursor-pointer hover:text-red-600"
                      onClick={() => handleRemoveCategorySelected(cat._id)}
                    />
                  </span>
                ))}
              </div>
              <select
                className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-200"
                onChange={handleAddCategory}
                defaultValue=""
              >
                <option value="" disabled>
                  Select Category
                </option>
                {allCategory.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={
              !(
                subCategoryData.name &&
                (subCategoryData.image || subCategoryData.imageFile) &&
                subCategoryData.category.length
              ) || loading
            }
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              subCategoryData.name &&
              (subCategoryData.image || subCategoryData.imageFile) &&
              subCategoryData.category.length
                ? "bg-primary-200 hover:bg-primary-300"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? "Updating..." : "Update Subcategory"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditSubCategory;
