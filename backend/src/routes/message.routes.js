const express = require('express');
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/message.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Internal Messaging and Communication API
 */

// All routes are protected by JWT authentication
router.use(protect);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get user's conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination (lastMessageAt date)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/conversations', messageController.getConversations);

/**
 * @swagger
 * /api/messages/conversations:
 *   post:
 *     summary: Create or get a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *               type:
 *                 type: string
 *                 enum: [direct, group, department_broadcast, institution_broadcast]
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation created or retrieved
 */
router.post('/conversations', messageController.createConversation);

router.put('/conversations/:id/pin', messageController.togglePinConversation);
router.put('/conversations/:id/archive', messageController.toggleArchiveConversation);


/**
 * @swagger
 * /api/messages/search:
 *   get:
 *     summary: Search messages in user's conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', messageController.searchMessages);

/**
 * @swagger
 * /api/messages/read-all:
 *   put:
 *     summary: Mark a conversation as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *             properties:
 *               conversationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation marked as read
 */
router.put('/read-all', messageController.markConversationRead);

router.get('/search-users', messageController.searchUsers);

/**
 * @swagger
 * /api/messages/{conversationId}:
 *   get:
 *     summary: Get message history for a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message history
 */
router.get('/:conversationId', messageController.getMessageHistory);

/**
 * @swagger
 * /api/messages/{conversationId}:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, image, document]
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               replyTo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/:conversationId', messageController.sendMessage);

/**
 * @swagger
 * /api/messages/{id}:
 *   put:
 *     summary: Edit a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited
 */
router.put('/:id', messageController.editMessage);

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: Soft delete a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 */
router.delete('/:id', messageController.deleteMessage);

module.exports = router;
