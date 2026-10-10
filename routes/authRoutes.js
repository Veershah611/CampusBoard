const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Strict Campus Subdomain Validators
const ADMIN_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@faculty\.campusboard\.edu$/i;
const EMP_DOMAIN_REGEX = /^[a-zA-Z0-9._%+-]+@student\.campusboard\.edu$/i;
//here trailing i makes the test case -insensitive

// 1. Create Campus Account (Admin ONLY)
router.post('/provision', authenticate, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, campus email, and temporary password are required.' });
    }

    const assignedRole = role === 'Admin' ? 'Admin' : 'Member';
    const normalizedEmail = email.trim().toLowerCase();

    // Domain Policy Enforcement
    if (assignedRole === 'Admin' && !ADMIN_DOMAIN_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Faculty accounts must use the @faculty.campusboard.edu domain (e.g., username@faculty.campusboard.edu).'
      });
    }

    if (assignedRole === 'Member' && !EMP_DOMAIN_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Student accounts must use the @student.campusboard.edu domain (e.g., username@student.campusboard.edu).'
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An student account with this email already exists.' });
    }

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: assignedRole
    });

    return res.status(201).json({
      message: 'Account provisioned successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Provisioning error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

// 2. Campus Sign In (Universal Entrypoint)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Campus email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Basic Domain Structure Verification
    if (!ADMIN_DOMAIN_REGEX.test(normalizedEmail) && !EMP_DOMAIN_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Invalid domain. Email must end with @faculty.campusboard.edu or @student.campusboard.edu.'
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid campus credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid campus credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'campusboard_super_secret_key',
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Internal server error while retrieving users.' });
  }
});

module.exports = router;