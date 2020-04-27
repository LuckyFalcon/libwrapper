const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  GID: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  }
});

DeviceSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Device', DeviceSchema);