'use strict';

const Address = require('../models/Address');
const ApiError = require('../utils/ApiError');

const getAddresses = async (userId) => {
  const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return addresses;
};

const getAddressById = async (addressId, userId) => {
  const address = await Address.findOne({ _id: addressId, userId }).lean();
  if (!address) throw new ApiError(404, 'Address not found');
  return address;
};

const createAddress = async (userId, data) => {
  const count = await Address.countDocuments({ userId });

  // Auto-mark first address as default
  const isDefault = data.isDefault !== undefined ? data.isDefault : count === 0;

  if (isDefault) {
    await Address.updateMany({ userId }, { $set: { isDefault: false } });
  }

  const address = await Address.create({ ...data, userId, isDefault });
  return address;
};

const updateAddress = async (addressId, userId, data) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new ApiError(404, 'Address not found');
  if (data.isDefault) {
    await Address.updateMany({ userId, _id: { $ne: addressId } }, { $set: { isDefault: false } });
  }
  Object.assign(address, data);
  await address.save();
  return address;
};

const deleteAddress = async (addressId, userId) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new ApiError(404, 'Address not found');

  const wasDefault = address.isDefault;

  await Address.deleteOne({ _id: addressId, userId });

  // If the deleted address was the default, assign the next oldest as default
  if (wasDefault) {
    const nextAddress = await Address.findOne({ userId }).sort({ createdAt: 1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return address;
};

const setDefaultAddress = async (addressId, userId) => {
  const address = await Address.findOne({ _id: addressId, userId });
  if (!address) throw new ApiError(404, 'Address not found');
  await Address.updateMany({ userId }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();
  return address;
};

module.exports = {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
