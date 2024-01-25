const jwt = require("jsonwebtoken");

const maxAge = 12 * 60 * 60 * 1000;

const secret = process.env.JWT_SECRET_KEY;

module.exports.createToken = (id, username) => {
  return jwt.sign({ userId: id, name: username }, secret, {
    expiresIn: maxAge,
  });
};
