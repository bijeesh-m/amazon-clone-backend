const express = require("express");
const router = express.Router();
const adminController = require("../controller/adminController");
const { adminAuth } = require("../middleware/adminAuth");
const upload = require("../middleware/multer");

router.post("/login", adminController.adminLogin);
router.get("/getadmin", adminController.getAdmin);
router.delete("/logout", adminController.logout);
router.get("/users", adminController.users);
router.get("/user/:id", adminController.user);
router.get("/products", adminController.products);
router.get("/product/:id", adminController.productById);
router.delete("/product/:id", adminController.deleteProduct);
router.get("/products/:category", adminController.productByCategory);
router.put("/product/:id", adminController.updateProduct);
router.post("/addproduct", upload.single("image"), adminController.addProduct);
router.get("/orders", adminController.getOrders);
router.get("/orders/:id", adminController.getOrderById);
router.put("/order/:id", adminController.updateOrder);
router.get("/salesreport", adminController.salesReport);

module.exports = router;
