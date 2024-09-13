import { Router } from 'express';
import { getAllVideos } from '../controllers/video.controller';
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verifyJWT);

router.route("/get-videos").get(getAllVideos);