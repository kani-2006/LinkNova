const Url = require('../models/Url');
const Analytics = require('../models/Analytics');
const generateShortCode = require('../utils/generateShortCode');
const generateQRCode = require('../utils/generateQRCode');

// @desc    Create a shortened URL
// @route   POST /api/url/create
// @access  Private
exports.createUrl = async (req, res) => {
  const { originalUrl, customAlias, description, expiryDate } = req.body;
  const userId = req.user._id;

  try {
    if (!originalUrl) {
      return res.status(400).json({
        success: false,
        errors: [{ field: 'originalUrl', message: 'Destination URL is required' }]
      });
    }

    let shortCode = '';

    if (customAlias) {
      const trimmedAlias = customAlias.trim();
      const existing = await Url.findOne({ shortCode: trimmedAlias });
      if (existing) {
        return res.status(400).json({
          success: false,
          errors: [{ field: 'customAlias', message: 'This custom alias is already taken' }]
        });
      }
      shortCode = trimmedAlias;
    } else {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        shortCode = generateShortCode(6);
        const existing = await Url.findOne({ shortCode });
        if (!existing) isUnique = true;
        attempts++;
      }
      if (!isUnique) {
        return res.status(500).json({ success: false, error: 'Failed to generate unique short code' });
      }
    }

    // Generate redirect link for QR code
    const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const redirectLink = `${baseUrl}/${shortCode}`;

    // Auto-generate QR code base64 Data URI
    const qrCodeBase64 = await generateQRCode(redirectLink);

    const url = await Url.create({
      originalUrl,
      shortCode,
      customAlias: customAlias || '',
      qrCode: qrCodeBase64,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      userId
    });

    // Also support adding standard description field as dynamic attribute
    if (description) {
      url.set('description', description);
      await url.save();
    }

    res.status(201).json({
      success: true,
      data: url
    });
  } catch (error) {
    console.error('Create URL error:', error.message);
    res.status(500).json({ success: false, error: 'Server error creating shortened URL' });
  }
};

// @desc    Get all URLs created by logged in user
// @route   GET /api/url/all
// @access  Private
exports.getUrls = async (req, res) => {
  try {
    const urls = await Url.find({ userId: req.user._id }).sort({ createdAt: -1 });
    
    // Ensure all URL objects returned have description virtual/dynamic attribute if they exist
    const mappedUrls = urls.map(u => {
      const obj = u.toObject();
      obj.description = u.get('description') || '';
      return obj;
    });

    res.status(200).json({
      success: true,
      count: mappedUrls.length,
      data: mappedUrls
    });
  } catch (error) {
    console.error('Get URLs error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving links' });
  }
};

// @desc    Get a single shortened URL by ID
// @route   GET /api/url/:id
// @access  Private
exports.getUrlById = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    if (!url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    if (url.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, error: 'Not authorized to view this URL' });
    }

    const obj = url.toObject();
    obj.description = url.get('description') || '';

    res.status(200).json({
      success: true,
      data: obj
    });
  } catch (error) {
    console.error('Get URL error:', error.message);
    res.status(500).json({ success: false, error: 'Server error retrieving URL' });
  }
};

// @desc    Update a shortened URL
// @route   PUT /api/url/:id
// @access  Private
exports.updateUrl = async (req, res) => {
  const { originalUrl, description, expiryDate } = req.body;

  try {
    let url = await Url.findById(req.params.id);
    if (!url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    if (url.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, error: 'Not authorized to edit this link' });
    }

    if (originalUrl) url.originalUrl = originalUrl;
    if (description !== undefined) url.set('description', description);
    url.expiryDate = expiryDate ? new Date(expiryDate) : null;

    await url.save();

    const obj = url.toObject();
    obj.description = url.get('description') || '';

    res.status(200).json({
      success: true,
      data: obj
    });
  } catch (error) {
    console.error('Update URL error:', error.message);
    res.status(500).json({ success: false, error: 'Server error updating link' });
  }
};

// @desc    Delete a shortened URL
// @route   DELETE /api/url/:id
// @access  Private
exports.deleteUrl = async (req, res) => {
  try {
    const url = await Url.findById(req.params.id);
    if (!url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    if (url.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this link' });
    }

    // Delete associated analytics first
    await Analytics.deleteMany({ urlId: url._id });
    
    // Delete the URL document
    await Url.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Link and associated analytics deleted successfully'
    });
  } catch (error) {
    console.error('Delete URL error:', error.message);
    res.status(500).json({ success: false, error: 'Server error deleting link' });
  }
};

// @desc    Download QR Code as PNG file attachment
// @route   GET /api/url/download-qr/:shortCode
// @access  Public
exports.downloadQRCode = async (req, res) => {
  try {
    const url = await Url.findOne({ shortCode: req.params.shortCode });
    if (!url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }

    if (url.qrCode && url.qrCode.startsWith('data:image/png;base64,')) {
      const base64Data = url.qrCode.replace(/^data:image\/png;base64,/, "");
      const img = Buffer.from(base64Data, 'base64');
      
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length,
        'Content-Disposition': `attachment; filename="qrcode-${url.shortCode}.png"`
      });
      return res.end(img);
    }

    return res.status(400).json({ success: false, error: 'QR Code image not available' });
  } catch (error) {
    console.error('Download QR Code error:', error.message);
    res.status(500).json({ success: false, error: 'Server error downloading QR Code' });
  }
};

// @desc    Bulk create shortened URLs (CSV helper)
// @route   POST /api/url/bulk
// @access  Private
exports.bulkCreateUrls = async (req, res) => {
  const { urls } = req.body;
  const userId = req.user._id;

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid or empty bulk URL array' });
  }

  const results = { success: [], failed: [] };
  const baseUrl = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

  for (let idx = 0; idx < urls.length; idx++) {
    const item = urls[idx];
    const { originalUrl, customAlias, description, expiresAt, expiryDate } = item;
    
    // Support both expiresAt and expiryDate input parameter keys
    const rawExpiry = expiryDate || expiresAt;

    if (!originalUrl || !originalUrl.startsWith('http')) {
      results.failed.push({
        index: idx,
        originalUrl: originalUrl || '',
        error: 'Invalid URL. Must start with http:// or https://'
      });
      continue;
    }

    try {
      let shortCode = '';

      if (customAlias) {
        const trimmedAlias = customAlias.trim();
        const existing = await Url.findOne({ shortCode: trimmedAlias });
        if (existing) {
          results.failed.push({
            index: idx,
            originalUrl,
            customAlias,
            error: 'Alias is already taken'
          });
          continue;
        }
        shortCode = trimmedAlias;
      } else {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 5) {
          shortCode = generateShortCode(6);
          const existing = await Url.findOne({ shortCode });
          if (!existing) isUnique = true;
          attempts++;
        }
        if (!isUnique) {
          results.failed.push({ index: idx, originalUrl, error: 'Failed to generate unique short code' });
          continue;
        }
      }

      const redirectLink = `${baseUrl}/${shortCode}`;
      const qrCodeBase64 = await generateQRCode(redirectLink);

      const createdUrl = await Url.create({
        originalUrl,
        shortCode,
        customAlias: customAlias || '',
        qrCode: qrCodeBase64,
        expiryDate: rawExpiry ? new Date(rawExpiry) : null,
        userId
      });

      if (description) {
        createdUrl.set('description', description);
        await createdUrl.save();
      }

      const obj = createdUrl.toObject();
      obj.description = createdUrl.get('description') || '';
      results.success.push(obj);
    } catch (error) {
      results.failed.push({ index: idx, originalUrl, error: error.message });
    }
  }

  res.status(200).json({
    success: true,
    data: results
  });
};
