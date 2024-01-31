const User = require("../models/users");
const Product = require("../models/productModel");
const Order = require("../models/ordersSchema");
const Coupon = require("../models/coopenSchema");
const bcrypt = require("bcrypt");
const { createToken } = require("../helpers/createToken");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;
const client = require("twilio")(accountSid, authToken);
const { jwtDecode } = require("jwt-decode");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

////////////////////////////USER REGISTRATION/////////////////////////////

module.exports.register = async (req, res) => {
  const phoneNumber = "+" + req.body.phoneInput.ph;
  const user = req.body.inputValues;
  const userExist = await User.findOne({ email: user.email });
  if (!userExist) {
    client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phoneNumber, channel: "sms" })
      .then((verification) => {
        if (verification.status === "pending") {
          res.status(200).send("success");
        }
      })
      .catch((err) => {
        res.status(500).send("failed");
      });
  } else {
    res.status(500).send("User is Already exist");
  }
};

///////////////////////VERIFY OTP/////////////////////////////

module.exports.verifyOtp = async (req, res) => {
  const user = req.body.inputValues;
  const otp = req.body.otp;
  const phoneNumber = "+" + req.body.phoneInput.ph;

  client.verify.v2
    .services(verifySid)
    .verificationChecks.create({ to: phoneNumber, code: otp })
    .then(async (verification_check) => {
      if (verification_check.status === "approved") {
        const userInfo = await User.create(user);
        const token = createToken(userInfo._id, userInfo.username);
        res.cookie("userjwt", token, { httpOnly: true });
        res.status(200).json({ data: "success", token: token });
      } else {
        res.status(500).send("failed");
      }
    })
    .catch((err) => {
      res.status(500).send("failed");
    });
};

//////////////////////////USER LOGIN//////////////////////////

module.exports.login = async (req, res) => {
  const user = req.body;
  const userExist = await User.findOne({ email: user.email });
  if (userExist) {
    const auth = await bcrypt.compare(user.password, userExist.password);
    if (auth) {
      const token = createToken(userExist._id, userExist.username);
      res.cookie("userjwt", token);
      res.status(200).json({
        user: userExist,
        data: "success",
        token: token,
      });
    } else {
      res.status(500).send("failed");
    }
  } else {
    res.status(404).send("Incorrect email or password");
  }
};

/////////////////////USER LOGOUT////////////////////////////

module.exports.logOut = async (req, res) => {
  res.cookie("userjwt", " ", { httpOnly: true, expiresIn: 1 });
  res.status(200).send(req.cookies.userjwt);
};

//////////////////////////////GOOGLE AUTH////////////////////////

module.exports.googleauth = async (req, res) => {
  const user = jwtDecode(req.body.credential);
  const userExist = await User.findOne({ email: user.email });
  if (userExist) {
    const gToken = createToken(userExist._id, userExist.username);
    res.cookie("userjwt", gToken, { httpOnly: true });
    res.status(200).json({ data: "success", token: gToken });
  } else {
    res.status(200).send("user not found");
  }
};

///////////////////////GET ALL PRODUCTS/////////////////////////////

module.exports.products = async (req, res) => {
  const products = await Product.find();
  res.status(200).send(products);
};

///////////////////////GOOGLE FORM/////////////////////////////

module.exports.formfill = async (req, res) => {
  const user = req.body;
  const userExist = await User.findOne({ email: user.email });

  if (!userExist) {
    const newUser = await User.create(user);
    const token = createToken(newUser._id, newUser.username);
    res.cookie("userjwt", token, { httpOnly: true });
    res.status(200).json({ data: "success", token });
  } else {
    res.status(500).send("failed");
  }
};

///////////////////////////GET SPECIFIC PRODUCT////////////////////

module.exports.productById = async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  if (product) {
    res.status(200).send(product);
  } else {
    res.status(404).send("not found");
  }
};

///////////////////////////ADD TO CART/////////////////////////////

module.exports.addToCart = async (req, res) => {
  const userId = req.body._id;
  const prodId = req.params.id;
  const user = await User.findById(userId);
  const product = await Product.findById(prodId);
  if (user) {
    const isExist = await user.cart.find((item) => item._id == prodId);
    if (!isExist) {
      const uUser = await User.findByIdAndUpdate(userId, {
        $push: { cart: product },
      });
      await uUser.save();
      res.status(200).send("successfully added");
    } else {
      res.status(409).send("already added");
    }
  } else {
    res.status(409).send("Conflict");
  }
};

//////////////////////////USER CART/////////////////////

module.exports.userCart = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  const coupen = await Coupon.find();
  if (user) {
    res.status(200).send({ cart: user.cart, coupen: coupen });
  }
};

/////////////////////GET CART COUNT/////////////////////

module.exports.getCartCount = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (user) {
    const cartCount = user.cart.length;
    res.send({ data: cartCount, user: user });
  }
};

/////////////////////GET CART COUNT/////////////////////

module.exports.updateQuantity = async (req, res) => {
  const quantity = req.body.quantity;
  const prodId = req.params.prodId;
  const userId = req.params.userId;

  const user = await User.findById(userId);

  const updatedCart = user.cart.map((item) => {
    if (item._id == prodId) {
      return { ...item, qty: quantity };
    }
    return item;
  });
  const Uuser = await User.findByIdAndUpdate(userId, {
    $set: { cart: updatedCart },
  });

  res.status(200).send(Uuser.cart);
};

/////////////////////DELETE ITEM FROM CART/////////////////////

module.exports.deleteCartItem = async (req, res) => {
  const userId = req.params.userId;
  const prodId = req.params.id;
  const user = await User.findById(userId);
  const products = user.cart.filter((item) => item._id != prodId);
  await User.updateOne(
    { _id: userId },
    {
      $set: { cart: products },
    }
  );

  res.status(200).send({ data: "success" });
};

/////////////////////GET USER/////////////////////////

module.exports.getUser = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  const coupen = await Coupon.find();
  res.status(200).json({ user: user.address, cart: user.cart, coupen: coupen });
};

/////////////////////USER ADDRESS/////////////////////

module.exports.getaddress = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  const address = user.address;
  if (address) {
    res.send(address);
  } else {
    res.status(404).send("Item not found");
  }
};

/////////////////////ADDRESS UPDATE/////////////////////

module.exports.address = async (req, res) => {
  const address = req.body.values;
  const userId = req.body.user.userId;
  const uAddress = await User.findOneAndUpdate(
    { _id: userId },
    {
      $set: { address: address },
    }
  );
  if (uAddress) {
    res.status(200).send("success");
  } else {
    res.status(500).send("failed");
  }
};

///////////////////PRODUCT BY CATEGORY/////////////////////

module.exports.productsByCategory = async (req, res) => {
  const category = req.params.category;
  const products = await Product.find({ category: category });
  if (products) {
    res.status(200).send(products);
  } else {
    res.status(404).send("product not found");
  }
};

module.exports.processPayment = async (req, res) => {
  const userId = req.params.id;
  const { totalPrice } = req.body;
  const total = Math.round(totalPrice + 40);
  const user = await User.findById(userId);
  const products = user.cart;

  const lineItems = products.map((items) => ({
    price_data: {
      currency: "inr",
      product_data: {
        name: items.title,
        images: [items.image],
      },
      unit_amount: items.price * 100,
    },
    quantity: items.qty,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `https://amazon-clone-friendend.vercel.app/success?paymentStatus=success&user=${userId}&total=${total}`,
    cancel_url: "https://amazon-clone-friendend.vercel.app/cancel",
  });
  res.send(session.id);
};

module.exports.updateOrder = async (req, res) => {
  const { totalPrice } = req.body;
  const userId = req.params.id;
  const user = await User.findById(userId);
  const products = user.cart;
  const newOrder = await Order.create({
    user: userId,
    products: products,
    totalPrice: totalPrice,
    status: "Pending",
  });
  if (newOrder) {
    const updatedCart = user.cart.filter((item) => {
      return !products.some((product) => product._id === item._id);
    });
    await User.findByIdAndUpdate(userId, {
      $set: { cart: updatedCart },
      $push: { orders: newOrder.id },
    });
    res.status(200).send("Order success");
  }
};

module.exports.Orders = async (req, res) => {
  const cookie = req.cookies.userjwt;
  if (cookie) {
    const user = jwtDecode(cookie);
    const Uuser = await User.findById(user.userId).populate("orders");
    res.status(200).send(Uuser.orders);
  }
};

module.exports.viewOrder = async (req, res) => {
  const orderId = req.params.id;
  const order = await Order.findById(orderId).populate("user");
  res.send(order);
};
