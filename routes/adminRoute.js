const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { adminAuth } = require("../middleware/adminAuth");
const upload = require("../middleware/multer");

router.post("/login", adminController.adminLogin);
router.get("/getadmin", adminController.getAdmin);
router.delete("/logout", adminController.logout);
router.get("/users", adminAuth,adminController.users);
router.get("/user/:id", adminAuth,adminController.user);
router.get("/products", adminAuth,adminController.products);
router.get("/product/:id", adminAuth,adminController.productById);
router.delete("/product/:id", adminAuth,adminController.deleteProduct);
router.get("/products/:category", adminAuth,adminController.productByCategory);
router.put("/product/:id", adminAuth,adminController.updateProduct);
router.post("/addproduct", adminAuth,upload.single("image"), adminController.addProduct);
router.get("/orders", adminAuth,adminController.getOrders);
router.get("/orders/:id", adminAuth,adminController.getOrderById);
router.put("/order/:id", adminAuth,adminController.updateOrderStatus);
router.get("/salesreport", adminAuth,adminController.salesReport);

module.exports = router;
