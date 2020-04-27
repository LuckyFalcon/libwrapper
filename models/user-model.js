const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50
  },
  hash: {
    type: String,
    required: true
  },
  createdDate: { 
    type: Date, 
    default: Date.now 
  },
  administrator: {
    type: Boolean,
    required: true,
    default: false //Default admin is false
  }
});

UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);