import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';

const uploadImage = async (image) => {
  try {
    const formData = new FormData();
    formData.append('image', image);

    const response = await Axios({
      ...SummaryApi.uploadImage,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' } // important for file uploads
    });

    // response.data is the JSON from your server
    // Your backend sends { success, data, message }
    if (response.data?.success) {
      return response.data; // return { success, data, message }
    } else {
      console.error("Upload failed:", response.data?.message);
      return null;
    }
  } catch (error) {
    console.error("Upload Error:", error);
    return null;
  }
};

export default uploadImage;
