const express =require('express')
const { testControlller } = require('../controllers/testController')



//router object
const router =express.Router();

//routes
router.get("/",testControlller);

module.exports = router;