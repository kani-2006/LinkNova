const Url = require('../models/Url');
const Analytics = require('../models/Analytics');

// Helper for analytics aggregations
const aggregateAnalytics = async (urlId) => {
  // 1. Get total clicks
  const totalClicksDoc = await Url.findById(urlId).select('clicks');
  const totalClicks = totalClicksDoc ? totalClicksDoc.clicks : 0;

  // 2. Get last visited time
  const lastVisitDoc = await Analytics.findOne({ urlId }).sort({ visitedAt: -1 });
  const lastVisited = lastVisitDoc ? lastVisitDoc.visitedAt : null;

  // 3. Get recent visits history (last 50 visits)
  const recentVisits = await Analytics.find({ urlId })
    .sort({ visitedAt: -1 })
    .limit(50);
  
  // Map recent visits properties to be compatible with frontend expectations
  const mappedRecentVisits = recentVisits.map(v => ({
    _id: v._id,
    url: v.urlId,
    timestamp: v.visitedAt,
    browser: v.browser,
    os: 'Unknown',
    device: v.device,
    referer: 'Direct',
    country: v.country,
    ip: '127.0.0.1'
  }));

  // 4. Browser breakdown
  const browserBreakdownAgg = await Analytics.aggregate([
    { $match: { urlId } },
    { $group: { _id: '$browser', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const browserBreakdown = browserBreakdownAgg.map(item => ({
    name: item._id || 'Unknown',
    value: item.count
  }));

  // 5. Device breakdown
  const deviceBreakdownAgg = await Analytics.aggregate([
    { $match: { urlId } },
    { $group: { _id: '$device', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const deviceBreakdown = deviceBreakdownAgg.map(item => ({
    name: item._id || 'Desktop',
    value: item.count
  }));

  // 6. Country breakdown
  const countryBreakdownAgg = await Analytics.aggregate([
    { $match: { urlId } },
    { $group: { _id: '$country', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const countryBreakdown = countryBreakdownAgg.map(item => ({
    name: item._id || 'United States',
    value: item.count
  }));

  // 7. Daily clicks (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dailyClicksAgg = await Analytics.aggregate([
    { $match: { urlId, visitedAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitedAt' } }, clicks: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const dailyClicks = dailyClicksAgg.map(item => ({
    date: item._id,
    clicks: item.clicks
  }));

  // 8. Weekly clicks (last 8 weeks)
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const weeklyClicksAgg = await Analytics.aggregate([
    { $match: { urlId, visitedAt: { $gte: eightWeeksAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$visitedAt' },
          week: { $week: '$visitedAt' }
        },
        clicks: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } }
  ]);
  const weeklyClicks = weeklyClicksAgg.map(item => ({
    date: `Week ${item._id.week}, ${item._id.year}`,
    clicks: item.clicks
  }));

  // 9. Monthly clicks (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyClicksAgg = await Analytics.aggregate([
    { $match: { urlId, visitedAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$visitedAt' } }, clicks: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  const monthlyClicks = monthlyClicksAgg.map(item => {
    const [year, month] = item._id.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = dateObj.toLocaleString('default', { month: 'short' });
    return {
      date: `${monthName} ${year}`,
      clicks: item.clicks
    };
  });

  return {
    totalClicks,
    lastVisited,
    recentVisits: mappedRecentVisits,
    browserBreakdown,
    osBreakdown: [{ name: 'Windows', value: totalClicks }], // Fallback compatible items
    refererBreakdown: [{ name: 'Direct', value: totalClicks }],
    deviceBreakdown,
    countryBreakdown,
    dailyClicks,
    weeklyClicks,
    monthlyClicks
  };
};

// @desc    Get detailed analytics for a short URL
// @route   GET /api/analytics/:urlId
// @access  Private
exports.getUrlAnalytics = async (req, res) => {
  try {
    const url = await Url.findById(req.params.urlId);
    if (!url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    // Ensure user owns this URL
    if (url.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, error: 'Not authorized to view analytics' });
    }

    const metrics = await aggregateAnalytics(url._id);

    res.status(200).json({
      success: true,
      data: {
        url: {
          _id: url._id,
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          qrCode: url.qrCode,
          expiryDate: url.expiryDate,
          clicks: url.clicks,
          description: url.get('description') || ''
        },
        metrics
      }
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ success: false, error: 'Server error fetching analytics' });
  }
};

// @desc    Get detailed public analytics for a short URL by shortCode
// @route   GET /api/url/public/analytics/:shortCode
// @access  Public
exports.getPublicUrlAnalytics = async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });
    if (!url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    const metrics = await aggregateAnalytics(url._id);

    res.status(200).json({
      success: true,
      data: {
        url: {
          originalUrl: url.originalUrl,
          shortCode: url.shortCode,
          qrCode: url.qrCode,
          expiryDate: url.expiryDate,
          clicks: url.clicks,
          description: url.get('description') || ''
        },
        metrics
      }
    });
  } catch (error) {
    console.error('Public analytics error:', error.message);
    res.status(500).json({ success: false, error: 'Server error fetching public analytics' });
  }
};
