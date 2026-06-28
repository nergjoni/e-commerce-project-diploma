import express from "express";
import { chatWithShopAssistant } from "../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/", chatWithShopAssistant);

export default router;
