import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";
import {verifyJWT} from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); 

router.route("/c/:channelId").post(toggleSubscription);

router.route("/c/").get(getSubscribedChannels);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router;