const express = require("express");
const router = express.Router();
const PaymentController = require("../controllers/PaymentController");

router.post("/create", PaymentController.createPayment);
router.post("/callback", PaymentController.handleCallback);
router.post("/status", PaymentController.checkTransactionStatus);

module.exports = router;
