const express = require('express');
const User = require('../models/User');
const PartnerRequest = require('../models/PartnerRequest');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Search users by name/email (excluding self and existing partners)
router.get('/search', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    const me = await User.findById(req.userId);
    const users = await User.find({
      _id: { $ne: req.userId, $nin: me.partners },
      $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }]
    })
      .select('name email avatarColor')
      .limit(10);

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

// Send a partner request
router.post('/request', auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ message: 'toUserId is required' });
    if (toUserId === req.userId) return res.status(400).json({ message: "You can't add yourself as a partner" });

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(404).json({ message: 'User not found' });

    const existing = await PartnerRequest.findOne({ from: req.userId, to: toUserId });
    if (existing) {
      return res.status(409).json({ message: `A request already exists (status: ${existing.status})` });
    }

    const request = await PartnerRequest.create({ from: req.userId, to: toUserId });
    const fromUser = await User.findById(req.userId);

    sendEmail({
      toEmail: toUser.email,
      toName: toUser.name,
      subject: `${fromUser.name} wants to be your accountability partner!`,
      message: `${fromUser.name} sent you an accountability partner request on HabiTrackr. Log in to accept or decline.`
    }).catch(() => {});

    res.status(201).json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error sending partner request' });
  }
});

// View incoming pending requests
router.get('/requests/incoming', auth, async (req, res) => {
  try {
    const requests = await PartnerRequest.find({ to: req.userId, status: 'pending' }).populate(
      'from',
      'name email avatarColor'
    );
    res.json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching requests' });
  }
});

// Respond to a request (accept/reject)
router.post('/requests/:id/respond', auth, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
    }

    const request = await PartnerRequest.findOne({ _id: req.params.id, to: req.userId, status: 'pending' });
    if (!request) return res.status(404).json({ message: 'Request not found or already handled' });

    request.status = action === 'accept' ? 'accepted' : 'rejected';
    await request.save();

    if (action === 'accept') {
      await User.findByIdAndUpdate(request.from, { $addToSet: { partners: request.to } });
      await User.findByIdAndUpdate(request.to, { $addToSet: { partners: request.from } });
    }

    res.json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error responding to request' });
  }
});

// List my accountability partners with a snapshot of their habits
router.get('/', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate('partners', 'name email avatarColor points');

    const partnersWithHabits = await Promise.all(
      me.partners.map(async (partner) => {
        const habits = await Habit.find({ user: partner._id, isArchived: false }).select(
          'title currentStreak longestStreak lastCompletedDate'
        );
        return { ...partner.toObject(), habits };
      })
    );

    res.json({ partners: partnersWithHabits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching partners' });
  }
});

// Remove a partner
router.delete('/:partnerId', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { $pull: { partners: req.params.partnerId } });
    await User.findByIdAndUpdate(req.params.partnerId, { $pull: { partners: req.userId } });
    res.json({ message: 'Partner removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error removing partner' });
  }
});

module.exports = router;
