import { Router } from "express";
import { fetchNextChallanNo } from "./generate.controller.js";

const router = Router();

router.get("/next", fetchNextChallanNo);

export default router;