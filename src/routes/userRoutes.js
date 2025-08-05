const express = require('express');
const UserController = require('../controllers/userController');

const router = express.Router();

router.post('/', UserController.createUser);
router.get('/:userId', UserController.getUserById);
router.get('/by-username/:username', UserController.getUserByUsername);

module.exports = router;
