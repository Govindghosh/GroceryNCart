import dotenv from "dotenv";
import connectDB from "./db/index.db.js";
import app from "./app.js";
dotenv.config({
  path: "./.env",
});
const port = process.env.PORT;
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`📶 Server is running at port ⋙   http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection is failed ❗  `, error);
  });
