import express  from "express";
import { getAnnouncement, createAnnouncement, updateAnnouncement, togglePinAnnouncement, deleteAnnouncement } from "../controllers/announcementController.js";
import { protectRoute, authorizedRoles } from "../middlewares/authMiddlewares.js";

const router: express.Router = express.Router();

router.use(protectRoute);

// Required login for all announcement routes

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Retrieve all announcements
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: A list of announcements.
 */
router.get('/', getAnnouncement);

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Create an announcement
 *     tags: [Announcements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               targetAudience:
 *                 type: string
 *                 example: "All"
 *     responses:
 *       201:
 *         description: Announcement created successfully.
 */
// endpoint (Admin only)
router.post('/', protectRoute, authorizedRoles('ADMIN'), createAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement updated successfully.
 */
router.put('/:id', protectRoute, authorizedRoles('ADMIN'), updateAnnouncement);


/**
 * @swagger
 * /api/announcements/{id}:
 *   patch:
 *     summary: Partially update an announcement
 *     description: Update specific fields of an announcement by ID. Accessible only by Admins.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Upcoming Parent-Teacher Conference"
 *               content:
 *                 type: string
 *                 example: "The conference will take place this Friday at 3 PM."
 *               isPinned:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id', protectRoute, authorizedRoles('ADMIN'), updateAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}/pin:
 *   patch:
 *     summary: Toggle pinned status of an announcement
 *     description: Toggles whether an announcement is pinned to the top of the feed. Accessible only by Admins.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The announcement ID
 *     responses:
 *       200:
 *         description: Announcement pin status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Announcement pinned status toggled successfully"
 *                 isPinned:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/pin', protectRoute, authorizedRoles('ADMIN'), togglePinAnnouncement);
/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Announcement deleted successfully.
 */
router.delete('/:id', protectRoute, authorizedRoles('ADMIN'), deleteAnnouncement);

export default router;