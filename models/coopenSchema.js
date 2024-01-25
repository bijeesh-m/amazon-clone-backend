const mongoose = require("mongoose");

// Define the schema
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  validFrom: {
    type: Date,
    // required: true,
  },
  validUntil: {
    type: Date,
    // required: true,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
