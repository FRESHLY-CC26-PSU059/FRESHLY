/**
 * @swagger
 * tags:
 *   name: Stats
 *   description: Platform statistics and analytics
 */

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get platform statistics
 *     description: Retrieve real-time platform statistics including total scans, accuracy, varieties, and processing time
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalScans:
 *                       type: integer
 *                       description: Total number of scans analyzed
 *                       example: 12543
 *                     accuracy:
 *                       type: integer
 *                       description: Average detection accuracy percentage
 *                       example: 94
 *                     uniqueVarieties:
 *                       type: integer
 *                       description: Number of unique fruit varieties detected
 *                       example: 23
 *                     avgProcessingTime:
 *                       type: string
 *                       description: Average processing time in seconds
 *                       example: "1.5"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/stats/analytics:
 *   get:
 *     summary: Get detailed analytics
 *     description: Retrieve detailed analytics including scans by fruit type, ripeness level, and daily trends
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     scansByFruit:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           object_name:
 *                             type: string
 *                             example: "Apple"
 *                           count:
 *                             type: integer
 *                             example: 1234
 *                     scansByRipeness:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           ripeness_level:
 *                             type: string
 *                             example: "Ripe"
 *                           count:
 *                             type: integer
 *                             example: 567
 *                     dailyScans:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2024-01-15"
 *                           count:
 *                             type: integer
 *                             example: 89
 *       500:
 *         description: Server error
 */

module.exports = {};
