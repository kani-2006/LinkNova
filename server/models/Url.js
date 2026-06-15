const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Please add the original destination URL']
    },
    shortCode: {
      type: String,
      required: true,
      unique: true
    },
    customAlias: {
      type: String,
      default: ''
    },
    qrCode: {
      type: String,
      default: ''
    },
    expiryDate: {
      type: Date,
      default: null
    },
    clicks: {
      type: Number,
      default: 0
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Url', UrlSchema);
