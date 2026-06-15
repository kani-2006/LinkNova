const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    device: {
      type: String,
      default: 'Desktop'
    },
    country: {
      type: String,
      default: 'United States'
    },
    visitedAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model('Analytics', AnalyticsSchema);
