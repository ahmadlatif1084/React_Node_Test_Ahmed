const express = require('express');

const router = express.Router();

const meeting = require('./meeting');
const auth = require('../../middelwares/auth');
router.get('/', auth, meeting.index)
router.post('/add', auth, meeting.add)
router.post('/deleteMany', auth, meeting.deleteMany)
router.get('/view/:id', auth, meeting.view)

module.exports = router