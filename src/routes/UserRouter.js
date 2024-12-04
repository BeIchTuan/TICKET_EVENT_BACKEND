const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { authMiddleware } = require("../middlewares/AuthMiddleware");
const upload = require("../middlewares/UploadImage");

//Work with user information
router.get(
  "/information",
  authMiddleware(["ticket_buyer", "event_creator", "admin"]),
  userController.getUser
);

router.put(
  "/update",
  upload.single("avatar"),
  authMiddleware(["ticket_buyer", "event_creator", "admin"]),
  userController.updateUser
);
// router.delete('/user/:id', userController.deleteUser)

//Get all users
router.get("/all", authMiddleware(["admin"]), userController.getUsers);

//Search users
router.get("/search", userController.searchUsers);


module.exports = router;
