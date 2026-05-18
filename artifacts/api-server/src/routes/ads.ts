import { Router, type IRouter } from "express";
import { optionalAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/ads/config", optionalAuth, (req: AuthedRequest, res) => {
  const isVip = req.user?.plan === "vip";
  res.json({
    provider: process.env.ADS_PROVIDER ?? "custom",
    adToken: process.env.ADS_TOKEN ?? null,
    preroll: !isVip,
    postroll: true,
  });
});

export default router;
