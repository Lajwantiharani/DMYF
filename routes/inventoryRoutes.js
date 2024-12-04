const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createInventoryController,
  getInventoryController,
} = require("../controllers/inventoryController");

const router = express.Router();

//routes

router.post('/create-inventory', authMiddleware, createInventoryController);




//get ALL BLOOD DONORS

router.get('/get-inventory',authMiddleware,getInventoryController);



module.exports = router;
