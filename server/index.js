require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const Order = require('./models/Order');
const Customer = require('./models/Customer');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Auth Routes ---

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register (Public for Users, Restricted for Admin roles)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Role Logic: 
    // - Anyone can register as 'user'
    // - Only an Admin can create another 'admin'
    // - If it's the very first user, they become 'admin'
    const userCount = await User.countDocuments();
    let finalRole = role || 'user';

    if (userCount > 0 && finalRole === 'admin') {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (!token) return res.status(401).json({ success: false, message: 'Admin access required to create admin users' });
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Only admins can create other admin users' });
        }
      } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
      }
    } else if (userCount === 0) {
      finalRole = 'admin'; // First user is always admin
    }

    const newUser = new User({ username, password, role: finalRole });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all users (Admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const users = await User.find({}, '-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user (Admin only)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Order & Customer Routes (Protected) ---

app.get('/api/customers/check/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    let customer = await Customer.findOne({ name: new RegExp(`^${name}$`, 'i') });
    
    if (customer) {
      return res.json({ success: true, exists: true, customer });
    }

    customer = new Customer({ name });
    await customer.save();
    
    res.json({ success: true, exists: false, customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { 
      customerName, 
      projectName, 
      services, 
      projectCost, 
      paidAmount, 
      paymentMode,
      bankName,
      orderDate
    } = req.body;

    const balance = Number(projectCost) - Number(paidAmount);

    const newOrder = new Order({
      customerName,
      projectName,
      services,
      projectCost: Number(projectCost),
      paidAmount: Number(paidAmount),
      balance,
      paymentMode,
      bankName: paymentMode === 'Bank' ? bankName : undefined,
      orderDate: new Date(orderDate),
      createdBy: req.user.id // Associate order with the user
    });

    const savedOrder = await newOrder.save();

    await Customer.findOneAndUpdate(
      { name: customerName },
      { name: customerName },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save order', error: error.message });
  }
});

app.get('/api/orders/customer/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    const query = { 
      customerName: new RegExp(`^${name}$`, 'i'),
      balance: { $gt: 0 } 
    };

    // Data Isolation: Only admin can see everyone's orders
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const orders = await Order.find(query);
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const query = {};
    
    // Data Isolation: Only admin can see everyone's orders
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const orders = await Order.find(query).sort({ orderDate: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.patch('/api/orders/:id/payment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMode, bankName } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const paymentAmount = Number(amount);
    order.paidAmount += paymentAmount;
    order.balance -= paymentAmount;
    
    if (paymentMode) order.paymentMode = paymentMode;
    if (bankName) order.bankName = bankName;

    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
