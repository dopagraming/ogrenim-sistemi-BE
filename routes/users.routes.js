import { Router } from "express";
import * as ctrl from "../controllers/users.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.get("/", protect, requireAdmin, ctrl.listUsers);
router.post("/", protect, requireAdmin, ctrl.createUser);
router.put("/:id", protect, requireAdmin, ctrl.updateUser);
router.delete("/:id", protect, requireAdmin, ctrl.deleteUser);

export default router;
