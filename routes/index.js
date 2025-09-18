const express = require('express');
const router = express.Router();
const userRoutes = require('../modules/users/Routers');
const subjectRoutes = require('../modules/subject/Routers');
const authenticate = require('../middleware/authenticate');
router.use('/users', userRoutes);
router.use('/subject',authenticate, subjectRoutes);
module.exports = router;