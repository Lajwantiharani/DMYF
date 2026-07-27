const JWT = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];


    let token = null;
    if (authHeader && typeof authHeader === "string") {
      token = authHeader.split(" ")[1]; // Bearer <token>
    }

    if (!token && typeof req.headers.cookie === "string") {
      const match = req.headers.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("token="));
      if (match) {
        token = decodeURIComponent(match.slice("token=".length));
      }
    }

    if (!token) {
      return res.status(401).send({
        success: false,
        message: "Auth token missing",
      });
    }

    JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({
          success: false,
          message: "Auth failed",
        });
      } else {

        req.userId = decoded.userId;
        req.body.userId = decoded.userId;
        next();
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      message: "Auth failed",
    });
  }
};
