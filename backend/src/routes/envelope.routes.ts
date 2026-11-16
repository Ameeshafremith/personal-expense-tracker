
import { Router } from "express";
import {
    addEnvelope,
    getAllEnvelopes,
    editEnvelope,
    removeEnvelope
} from "../controllers/envelope.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", addEnvelope);
router.get("/", getAllEnvelopes);
router.put("/:envelopeId", editEnvelope);
router.delete("/:envelopeId", removeEnvelope);

export default router;
