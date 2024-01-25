const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/register", userController.register);
router.post("/verify-otp", userController.verifyOtp);
router.post("/login", userController.login);
router.get("/logout", userController.logOut);
router.get("/getuser/:id", userController.getUser);
router.get("/products", userController.products);
router.get("/products/:category", userController.productsByCategory);
router.post("/addtocart/:id", authenticate, userController.addToCart);
router.get("/cart/:id", userController.userCart);
router.get("/cartcount/:id", userController.getCartCount);
router.put(
  "/updatecartquantity/:prodId/:userId",
  userController.updateQuantity
);
router.delete("/deletecartitem/:id/:userId", userController.deleteCartItem);
router.post("/googlefill", userController.formfill);
router.get("/product/:id", userController.productById);
router.post("/googleauth", userController.googleauth);
router.post("/address", userController.address);
router.get("/getaddress/:id", userController.getaddress);
router.post("/payment/:id", userController.processPayment);
router.post("/update-oreders/:id", userController.updateOrder);
router.get("/orders", userController.Orders);
router.get("/vieworder/:id", userController.viewOrder);

module.exports = router;
