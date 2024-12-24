const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createInventoryController,
  getInventoryController,
  getDonorsController,
  getHospitalController,
} = require("../controllers/inventoryController");

const router = express.Router();

//routes
//add inventory || POST 
router.post('/create-inventory', authMiddleware, createInventoryController);




//get ALL BLOOD DONORS

router.get('/get-inventory',authMiddleware,getInventoryController);
//get donor records
router.get("/get-donors", authMiddleware, getDonorsController);
//get hospital  records
router.get("/get-hospitals", authMiddleware, getHospitalController);

module.exports = router;
