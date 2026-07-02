const express = require('express');
const { protect } = require('../middleware/auth');
const contactController = require('../controllers/contact.controller');

const router = express.Router();

// Route is protected by JWT validation middleware
router.use(protect);

router.get('/', contactController.getContacts);

module.exports = router;
