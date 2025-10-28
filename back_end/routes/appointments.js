const express = require('express');
const router = express.Router();
const { getAppointments, addAppointment } = require('../controllers/appointmentsController');

router.get('/', getAppointments);
router.post('/', addAppointment);

module.exports = router;
