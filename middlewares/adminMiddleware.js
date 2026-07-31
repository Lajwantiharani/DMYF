const prisma = require("../config/prisma");

module.exports = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.body.userId },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return res.status(401).send({
        success: false,
        message: "Auth failed: Admin access required",
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).send({
      success: false,
      message: "Auth failed: Admin API",
    });
  }
};
