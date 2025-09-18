import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import toast from "react-hot-toast";
import AxiosToastError from "../utils/AxiosToastError";

const EditCategory = ({ close, fetchData, data: CategoryData }) => {
  const [data, setData] = useState({
    _id: CategoryData._id,
    name: CategoryData.name,
    image: CategoryData.image,
  });
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadCategoryImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setData((prev) => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.name || !data.image) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("_id", data._id);
      formData.append("name", data.name);

      if (data.image instanceof File) formData.append("image", data.image);

      const response = await Axios({
        ...SummaryApi.updateCategory,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        close();
        fetchData();
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-2xl w-full rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Update Category</h1>
          <button onClick={close} className="text-gray-600 hover:text-gray-900">
            <IoClose size={28} />
          </button>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="grid gap-1">
            <label className="font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={data.name}
              onChange={handleOnChange}
              placeholder="Enter category name"
              className="p-3 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>

          {/* Image Upload */}
          <div className="grid gap-1">
            <label className="font-medium">Image</label>
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="border border-gray-200 h-36 w-full lg:w-36 bg-blue-50 rounded-lg flex items-center justify-center overflow-hidden">
                {data.image ? (
                  <img
                    src={data.image instanceof File ? URL.createObjectURL(data.image) : data.image}
                    alt="category"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <p className="text-gray-400 text-sm">No Image</p>
                )}
              </div>

              <label
                htmlFor="uploadCategoryImage"
                className="px-5 py-2 bg-primary-200 text-white rounded-lg font-medium hover:bg-primary-300 cursor-pointer transition"
              >
                {loading ? "Loading..." : "Upload Image"}
              </label>
              <input
                type="file"
                id="uploadCategoryImage"
                className="hidden"
                onChange={handleUploadCategoryImage}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!data.name || !data.image || loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              data.name && data.image
                ? "bg-primary-200 hover:bg-primary-300"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? "Updating..." : "Update Category"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditCategory;
