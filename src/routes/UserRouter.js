const express = require("express");
const router = express.Router();
const userController = require("../controllers/UserController");
const { authMiddleware } = require("../middlewares/AuthMiddleware");
const upload = require("../middlewares/UploadImage");
const filterNullValues = require("../middlewares/FilterNullValues");

//Work with user information
router.get(
  "/information",
  authMiddleware(["ticket_buyer", "event_creator", "admin"]),
  userController.getUser
);

router.put(
  "/update",
  upload.single("avatar"),
  filterNullValues,
  authMiddleware(["ticket_buyer", "event_creator", "admin"]),
  userController.updateUser
);

//Routes for admin
//Get all users
router.get("/all", authMiddleware(["admin"]), userController.getUsers);
router.delete("/:id/delete", authMiddleware(["admin"]), userController.deleteUser);

//Search users
router.get(
  "/search",
  authMiddleware(["admin", "event_creator", "ticket_buyer"]),
  userController.searchUsers
);

module.exports = router;
