const express = require("express");
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

const app = express();
app.use(
  cors({
    origin: "https://amazon-clone-friendend.vercel.app",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/user", userRoute);
app.use("/admin", adminRoute);

mongoose
  .connect(
    "mongodb+srv://bijeesh:qN1PwM8yoav5NJs6@cluster0.rqmpu.mongodb.net/amazon"
  )
  .then(console.log("db connected"))
  .catch((err) => console.log(err.message));

app.listen(process.env.PORT, () => {
  console.log("server running");
});
