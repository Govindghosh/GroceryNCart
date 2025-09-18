import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  addSubCategoryController,
  deleteSubCategoryController,
  getSubCategoryController,
  updateSubCategoryController,
} from "../controllers/subCategory.controller.js";
import upload from "../middleware/multer.js";

const subCategoryRouter = Router();

subCategoryRouter.post(
  "/create",
  auth,
  upload.single("image"),
  addSubCategoryController
);
subCategoryRouter.post("/get", getSubCategoryController);
subCategoryRouter.put(
  "/update",
  auth,
  upload.single("image"),
  updateSubCategoryController
);
subCategoryRouter.delete("/delete", auth, deleteSubCategoryController);

export default subCategoryRouter;
