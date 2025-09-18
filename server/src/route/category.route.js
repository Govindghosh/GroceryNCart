import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  addCategoryController,
  deleteCategoryController,
  getCategoryController,
  updateCategoryController,
} from "../controllers/category.controller.js";
import upload from "../middleware/multer.js";

const categoryRouter = Router();

categoryRouter.post(
  "/add-category",
  auth,
  upload.single("image"),
  addCategoryController
);
categoryRouter.get("/get", getCategoryController);

categoryRouter.put(
  "/update",
  auth,
  upload.single("image"),
  updateCategoryController
);

categoryRouter.delete("/delete", auth, deleteCategoryController);

export default categoryRouter;
