
import { Router } from "express";
import {
    addWallet,
    getAllWallets,
    getSingleWallet,
    editWallet,
    removeWallet
} from "../controllers/wallet.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", addWallet);
router.get("/", getAllWallets);
router.get("/:walletId", getSingleWallet);
router.put("/:walletId", editWallet);
router.delete("/:walletId", removeWallet);

export default router;
