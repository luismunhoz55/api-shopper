import { Router } from "express";
import { uploadHandler } from "../controllers/uploadController";
import { confirmHandler } from "../controllers/confirmController";
import { listHandler } from "../controllers/listController";

const router = Router();

router.post("/upload", uploadHandler);
router.patch("/confirm", confirmHandler);
router.get("/:customer_code/list", listHandler);

export default router;
