import React, { useState, useEffect } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import Loading from "../components/Loading";
import ViewImage from "../components/ViewImage";
import { MdDelete } from "react-icons/md";
import { useSelector } from "react-redux";
import { IoClose } from "react-icons/io5";
import AddFieldComponent from "../components/AddFieldComponent";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import successAlert from "../utils/SuccessAlert";

const UploadProduct = () => {
  const [data, setData] = useState({
    name: "",
    image: [],
    category: [],
    subCategory: [],
    unit: "",
    stock: "",
    price: "",
    discount: "",
    description: "",
    more_details: {},
  });
  const [imageLoading, setImageLoading] = useState(false);
  const [ViewImageURL, setViewImageURL] = useState("");
  const allCategory = useSelector((state) => state.product.allCategory);
  const allSubCategory = useSelector((state) => state.product.allSubCategory);
  const [selectCategory, setSelectCategory] = useState("");
  const [selectSubCategory, setSelectSubCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAddField, setOpenAddField] = useState(false);
  const [fieldName, setFieldName] = useState("");

  // ✅ cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      data.image.forEach((img) => {
        if (img instanceof File) URL.revokeObjectURL(img);
      });
    };
  }, [data.image]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUploadImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageLoading(true);

    setData((prev) => ({
      ...prev,
      image: [...prev.image, file], // keep File object
    }));

    setImageLoading(false);
  };

  const handleDeleteImage = (index) => {
    const updated = [...data.image];
    updated.splice(index, 1);
    setData((prev) => ({ ...prev, image: updated }));
  };

  const handleRemoveCategory = (index) => {
    const updated = [...data.category];
    updated.splice(index, 1);
    setData((prev) => ({ ...prev, category: updated }));
  };

  const handleRemoveSubCategory = (index) => {
    const updated = [...data.subCategory];
    updated.splice(index, 1);
    setData((prev) => ({ ...prev, subCategory: updated }));
  };

  const handleAddField = () => {
    setData((prev) => ({
      ...prev,
      more_details: {
        ...prev.more_details,
        [fieldName]: "",
      },
    }));
    setFieldName("");
    setOpenAddField(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (data.image.length === 0) {
      setLoading(false);
      return alert("Please upload at least one image");
    }
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "image") {
        data.image.forEach((file) => formData.append("images", file));
      } else if (key === "category" || key === "subCategory") {
        data[key].forEach((item) =>
          formData.append(`${key}[]`, item._id || item)
        );
      } else if (key === "more_details") {
        formData.append(key, JSON.stringify(data.more_details));
      } else {
        formData.append(key, data[key]);
      }
    });

    try {
      const response = await Axios({
        ...SummaryApi.createProduct,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        successAlert(response.data.message);
        setData({
          name: "",
          image: [],
          category: [],
          subCategory: [],
          unit: "",
          stock: "",
          price: "",
          discount: "",
          description: "",
          more_details: {},
        });
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="p-2 bg-white shadow-md flex items-center justify-between">
        <h2 className="font-semibold">Upload Product</h2>
      </div>
      <div className="grid p-3">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="grid gap-1">
            <label htmlFor="name" className="font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={data.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
              className="bg-blue-50 p-2 border rounded outline-none"
            />
          </div>

          {/* Description */}
          <div className="grid gap-1">
            <label htmlFor="description" className="font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={data.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows={3}
              required
              className="bg-blue-50 p-2 border rounded outline-none resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <p className="font-medium">Image</p>
            <label
              htmlFor="productImage"
              className="bg-blue-50 h-24 border rounded flex justify-center items-center cursor-pointer"
            >
              <div className="text-center flex flex-col items-center">
                {imageLoading ? (
                  <Loading />
                ) : (
                  <>
                    <FaCloudUploadAlt size={35} />
                    <p>Upload Image</p>
                  </>
                )}
              </div>
              <input
                type="file"
                id="productImage"
                className="hidden"
                accept="image/*"
                onChange={handleUploadImage}
              />
            </label>

            {/* Preview */}
            <div className="flex flex-wrap gap-4">
              {data.image.map((img, index) => {
                const previewUrl =
                  typeof img === "string" ? img : URL.createObjectURL(img);

                return (
                  <div
                    key={index}
                    className="h-20 mt-1 w-20 min-w-20 bg-blue-50 border relative group"
                  >
                    <img
                      src={previewUrl}
                      alt={`preview-${index}`}
                      className="w-full h-full object-scale-down cursor-pointer"
                      onClick={() => setViewImageURL(previewUrl)}
                    />
                    <div
                      onClick={() => handleDeleteImage(index)}
                      className="absolute bottom-0 right-0 p-1 bg-red-600 hover:bg-red-700 rounded text-white hidden group-hover:block cursor-pointer"
                    >
                      <MdDelete />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className="grid gap-1">
            <label className="font-medium">Category</label>
            <select
              className="bg-blue-50 border w-full p-2 rounded"
              value={selectCategory}
              onChange={(e) => {
                const value = e.target.value;
                const category = allCategory.find((el) => el._id === value);
                if (!category) return;
                setData((prev) => ({
                  ...prev,
                  category: [...prev.category, category],
                }));
                setSelectCategory("");
              }}
            >
              <option value={""}>Select Category</option>
              {allCategory.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-3">
              {data.category.map((c, index) => (
                <div
                  key={c._id + index}
                  className="text-sm flex items-center gap-1 bg-blue-50 mt-2 px-2 py-1 rounded"
                >
                  <p>{c.name}</p>
                  <IoClose
                    size={20}
                    className="hover:text-red-500 cursor-pointer"
                    onClick={() => handleRemoveCategory(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sub Category */}
          <div className="grid gap-1">
            <label className="font-medium">Sub Category</label>
            <select
              className="bg-blue-50 border w-full p-2 rounded"
              value={selectSubCategory}
              onChange={(e) => {
                const value = e.target.value;
                const subCategory = allSubCategory.find(
                  (el) => el._id === value
                );
                if (!subCategory) return;
                setData((prev) => ({
                  ...prev,
                  subCategory: [...prev.subCategory, subCategory],
                }));
                setSelectSubCategory("");
              }}
            >
              <option value={""}>Select Sub Category</option>
              {allSubCategory.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-3">
              {data.subCategory.map((c, index) => (
                <div
                  key={c._id + index}
                  className="text-sm flex items-center gap-1 bg-blue-50 mt-2 px-2 py-1 rounded"
                >
                  <p>{c.name}</p>
                  <IoClose
                    size={20}
                    className="hover:text-red-500 cursor-pointer"
                    onClick={() => handleRemoveSubCategory(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Unit */}
          <div className="grid gap-1">
            <label htmlFor="unit" className="font-medium">
              Unit
            </label>
            <input
              id="unit"
              type="text"
              name="unit"
              value={data.unit}
              onChange={handleChange}
              placeholder="Enter product unit"
              required
              className="bg-blue-50 p-2 border rounded outline-none"
            />
          </div>

          {/* Stock */}
          <div className="grid gap-1">
            <label htmlFor="stock" className="font-medium">
              Stock
            </label>
            <input
              id="stock"
              type="number"
              name="stock"
              value={data.stock}
              onChange={handleChange}
              placeholder="Enter stock"
              required
              className="bg-blue-50 p-2 border rounded outline-none"
            />
          </div>

          {/* Price */}
          <div className="grid gap-1">
            <label htmlFor="price" className="font-medium">
              Price
            </label>
            <input
              id="price"
              type="number"
              name="price"
              value={data.price}
              onChange={handleChange}
              placeholder="Enter price"
              required
              className="bg-blue-50 p-2 border rounded outline-none"
            />
          </div>

          {/* Discount */}
          <div className="grid gap-1">
            <label htmlFor="discount" className="font-medium">
              Discount
            </label>
            <input
              id="discount"
              type="number"
              name="discount"
              value={data.discount}
              onChange={handleChange}
              placeholder="Enter discount"
              required
              className="bg-blue-50 p-2 border rounded outline-none"
            />
          </div>

          {/* Dynamic Extra Fields */}
          {Object.keys(data.more_details).map((k, index) => (
            <div key={index} className="grid gap-1">
              <label htmlFor={k} className="font-medium">
                {k}
              </label>
              <input
                id={k}
                type="text"
                value={data.more_details[k]}
                onChange={(e) => {
                  const value = e.target.value;
                  setData((prev) => ({
                    ...prev,
                    more_details: { ...prev.more_details, [k]: value },
                  }));
                }}
                required
                className="bg-blue-50 p-2 border rounded outline-none"
              />
            </div>
          ))}

          <div
            onClick={() => setOpenAddField(true)}
            className="hover:bg-primary-200 bg-white py-1 px-3 w-32 text-center font-semibold border border-primary-200 hover:text-neutral-900 cursor-pointer rounded"
          >
            Add Fields
          </div>

          <button
            type="submit"
            className="bg-primary-100 hover:bg-primary-200 py-2 rounded font-semibold"
          >
            {loading ? "Submitting.." : "Submit"}
          </button>
        </form>
      </div>

      {ViewImageURL && (
        <ViewImage url={ViewImageURL} close={() => setViewImageURL("")} />
      )}

      {openAddField && (
        <AddFieldComponent
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          submit={handleAddField}
          close={() => setOpenAddField(false)}
        />
      )}
    </section>
  );
};

export default UploadProduct;
