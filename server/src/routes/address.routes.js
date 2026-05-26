'use strict';

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', addressController.getAddresses);
router.get('/:id', addressController.getAddress);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router;
