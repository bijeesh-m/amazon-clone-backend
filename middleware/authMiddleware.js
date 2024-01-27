const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET_KEY;

const authenticate = (req, res, next) => {
  const token = req.cookies.userjwt;
  console.log(token);
  if (token !== " ") {
    jwt.verify(token, secretKey, (err) => {
      if (err) {
        res.status(401).send({ status: "Unauthorized", token: token });
      } else {
        next();
      }
    });
  } else {
    res.status(401).send({ status: "Unauthorized", token: token });
  }
};

module.exports = { authenticate };
