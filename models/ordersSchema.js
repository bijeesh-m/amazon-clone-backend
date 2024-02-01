const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  products: Array,
  orderId: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Shipped", "Delivered"],
    default: "Pending",
  },
  createdAt: { type: String, default: () => new Date().toLocaleString() },
});

const Order = mongoose.model("order", orderSchema);
module.exports = Order;
