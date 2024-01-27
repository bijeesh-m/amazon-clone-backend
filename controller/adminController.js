const Products = require("../models/productModel");
const Users = require("../models/users");
const cloudinary = require("../utils/cloudinary");
const { createToken } = require("../helpers/createToken");
const Order = require("../models/ordersSchema");

module.exports.adminLogin = async (req, res) => {
  const user = req.body;
  const token = createToken(user.email, user.password);
  res.cookie("adminjwt", token, { secure: true, sameSite: "none" });
  res.status(200).send("sucess");
};

module.exports.logout = async (req, res) => {
  res.cookie("adminjwt", " ", { httpOnly: true, expiresIn: 1 });
  res.status(200).send("success");
};

module.exports.users = async (req, res) => {
  const users = await Users.find();
  if (users) {
    res.status(200).send(users);
  }
};

module.exports.user = async (req, res) => {
  const userId = req.params.id;
  const user = await Users.findById(userId);
  if (user) {
    res.status(200).send(user);
  }
};

module.exports.products = async (req, res) => {
  const products = await Products.find();
  res.send(products);
};

///////////////////////productById///////////////////////////

module.exports.productById = async (req, res) => {
  const prodId = req.params.id;
  const product = await Products.findById(prodId);
  if (product) {
    res.status(200).send(product);
  } else {
    res.status(404).send("Product not found");
  }
};
///////////////////////////ADD PRODUCT///////////////////////

module.exports.addProduct = async (req, res, next) => {
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
};

module.exports.updateProduct = async (req, res) => {
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
};

module.exports.deleteProduct = async (req, res) => {
  const prodId = req.params.id;
  const product = await Products.findByIdAndDelete(prodId);
  if (!product) {
    res.status(404).send("Product not found");
  } else {
    res.status(200).send("Product Deleted");
  }
};

module.exports.productBySubCategory = async (req, res) => {
  const subcategory = req.params.subcategory;
  const products = await Products.find({ subcategory: subcategory });
  if (products) {
    res.status(200).send(products);
  }
};
module.exports.productByCategory = async (req, res) => {
  const category = req.params.category;
  const products = await Products.find({ subcategory: category });
  if (products) {
    res.status(200).send(products);
  }
};

module.exports.getOrders = async (req, res) => {
  const orders = await Order.find().populate("user");
  res.send(orders);
};
module.exports.getOrderById = async (req, res) => {
  const orderId = req.params.id;

  const orders = await Order.findById(orderId).populate("user");
  res.send(orders);
};

module.exports.updateOrder = async (req, res) => {
  const status = req.body.orderStatus;
  const orderId = req.params.id;
  const order = await Order.findByIdAndUpdate(orderId, {
    $set: { status: status },
  });
  res.status(200).send("Changes saved");
};

module.exports.salesReport = async (req, res) => {
  try {
    const monthlySales = await Order.aggregate([
      {
        $match: {
          status: "Delivered", // Filter orders with "Delivered" status
        },
      },
      {
        $addFields: {
          // Convert the string to a date
          createdAtDate: { $toDate: "$createdAt" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m", // Group by year and month
              date: "$createdAtDate",
            },
          },
          totalSales: { $sum: "$totalPrice" },
          totalSalesCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1, // Sort by year and month
        },
      },
    ]);
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


    const total = monthlySales.reduce((acc, value) => {
      return (acc = acc + value.totalPrice);
    }, 0);


    const mo = [];
    const sales = [];

    // Convert and log the monthly sales information with month names
    monthlySales.forEach((monthlySale) => {
      const [year, month] = monthlySale._id.split("-");
      const monthName = monthNames[parseInt(month, 10) - 1]; // Subtract 1 to match array index
      const totalSales = monthlySale.totalSales;
      mo.push(monthName);
      sales.push(totalSales);
    });

    res.send({ month: mo, sales: sales });
  } catch (error) {
    console.error("Error getting monthly sales:", error);
    throw error;
  }
};
