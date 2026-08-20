'use strict';

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/search', addressController.searchLocations);
router.get('/maps-token', addressController.getMapsToken);
router.get('/reverse-geocode', addressController.reverseGeocode);
router.get('/detect-location', addressController.detectLocation);

router.use(protect);

router.get('/', addressController.getAddresses);
router.get('/:id', addressController.getAddress);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router;
