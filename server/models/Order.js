const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  projectName: { type: String, required: true },
  services: { type: String, required: true },
  projectCost: { type: Number, required: true },
  paidAmount: { type: Number, required: true },
  balance: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'Bank'], required: true },
  bankName: { type: String },
  orderDate: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
