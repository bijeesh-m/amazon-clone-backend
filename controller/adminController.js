const Products = require("../models/productModel");
const Users = require("../models/users");
const cloudinary = require("../utils/cloudinary");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { createToken } = require("../helpers/createToken");
const Order = require("../models/ordersSchema");
const { jwtDecode } = require("jwt-decode");

module.exports.adminLogin = asyncErrorHandler(async (req, res) => {
  const user = req.body;
  const token = createToken(user.email, user.password);
  console.log(token);
  res.cookie("adminjwt", token, { secure: true, sameSite: "none" });
  res.status(200).send("sucess");
});

module.exports.getAdmin = asyncErrorHandler(async (req, res) => {
  const cookie = req.cookies.adminjwt;
  if (cookie) {
    const admin = jwtDecode(cookie);
    res.status(200).send(admin);
  }
});

module.exports.logout = asyncErrorHandler(async (req, res) => {
  res.cookie("adminjwt", " ", { httpOnly: true, expiresIn: 1 });
  res.status(200).send("success");
});

module.exports.users = asyncErrorHandler(async (req, res) => {
  const users = await Users.find();
  if (users) {
    res.status(200).send(users);
  }
});

module.exports.user = asyncErrorHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await Users.findById(userId);
  if (user) {
    res.status(200).send(user);
  }
});

module.exports.products = asyncErrorHandler(async (req, res) => {
  const products = await Products.find();
  res.send(products);
});

///////////////////////productById///////////////////////////

module.exports.productById = asyncErrorHandler(async (req, res) => {
  const prodId = req.params.id;
  const product = await Products.findById(prodId);
  if (product) {
    res.status(200).send(product);
  } else {
    res.status(404).send("Product not found");
  }
});
///////////////////////////ADD PRODUCT///////////////////////

module.exports.addProduct = asyncErrorHandler(async (req, res, next) => {
  const {
    productTitle,
    productCategory,
    productSubcategory,
    productDescription,
    productPrice,
    productImage,
  } = req.body;
  const isExist = await Products.findOne({ title: productTitle });
  if (isExist) {
    res.status(409).send("Product already exist");
  } else {
    const result = await cloudinary.uploader.upload(productImage);
    const product = await Products.create({
      category: productCategory,
      image: result.url,
      subcategory: productSubcategory,
      description: productDescription,
      price: productPrice,
      title: productTitle,
    });
    res.status(201).json({
      status: "success",
      message: "Successfully created a product.",
      data: product,
    });
  }
});

module.exports.updateProduct = asyncErrorHandler(async (req, res) => {
  const prodId = req.params.id;
  try {
    const { title, category, subcategory, description, price, image } =
      req.body;
    const result = await cloudinary.uploader.upload(image);
    await Products.findByIdAndUpdate(prodId, {
      $set: {
        title,
        description,
        subcategory,
        price,
        category,
        image: result.url,
      },
    });
    res.status(200).send("Product Updated");
  } catch (error) {
    console.log(error);
  }
});

module.exports.deleteProduct = asyncErrorHandler(async (req, res) => {
  const prodId = req.params.id;
  const product = await Products.findByIdAndDelete(prodId);
  if (!product) {
    res.status(404).send("Product not found");
  } else {
    res.status(200).send("Product Deleted");
  }
});

module.exports.productBySubCategory = asyncErrorHandler(async (req, res) => {
  const subcategory = req.params.subcategory;
  const products = await Products.find({ subcategory: subcategory });
  if (products) {
    res.status(200).send(products);
  }
});
module.exports.productByCategory = asyncErrorHandler(async (req, res) => {
  const category = req.params.category;
  const products = await Products.find({ subcategory: category });
  if (products) {
    res.status(200).send(products);
  }
});

module.exports.getOrders = asyncErrorHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  const orders = await Order.find().populate("user");
  const sortedOrder = orders.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();

    return timeB - timeA;
  });
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + 10;
  const uOrders = sortedOrder.slice(startIndex, endIndex);
  res.status(200).send(uOrders);
});

/////////////////////ORDER BY ID/////////////////////////

module.exports.getOrderById = asyncErrorHandler(async (req, res) => {
  const orderId = req.params.id;

  const orders = await Order.findOne({ orderId: orderId }).populate("user");
  res.send(orders);
});

/////////////////////Update Order Status/////////////////////////

module.exports.updateOrderStatus = asyncErrorHandler(async (req, res) => {
  const status = req.body.orderStatus;
  const orderId = req.params.id;
  const order = await Order.findOneAndUpdate(
    { orderId: orderId },
    {
      $set: { status: status },
    }
  );
  res.status(200).send("Changes saved");
});

/////////////////////SALES REPORT/////////////////////////

module.exports.salesReport = asyncErrorHandler(async (req, res) => {
  try {
    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $addFields: {
          createdAtDate: { $toDate: "$createdAt" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAtDate",
            },
          },
          totalSales: { $sum: "$totalPrice" },
          totalSalesCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    console.log(monthlySales);
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const totalSales = monthlySales.reduce((acc, monthlyData) => {
      return acc + monthlyData.totalSales;
    }, 0);

    const mo = [];
    const sales = [];

    monthlySales.forEach((monthlySale) => {
      const [year, month] = monthlySale._id.split("-");
      const monthName = monthNames[parseInt(month, 10) - 1];
      const totalSales = monthlySale.totalSales;
      mo.push(monthName);
      sales.push(totalSales);
    });

    res.send({ month: mo, sales: sales, total: totalSales.toLocaleString() });
  } catch (error) {
    console.error("Error getting monthly sales:", error);
  }
});
