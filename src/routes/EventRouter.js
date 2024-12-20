const express = require("express");
const router = express.Router();
const EventController = require("../controllers/EventController");
const upload = require("../middlewares/UploadImage");
const { authMiddleware } = require("../middlewares/AuthMiddleware");
const filterNullValues = require("../middlewares/FilterNullValues");

router.get(
  "/management",
  authMiddleware(["event_creator"]),
  EventController.getManagedEvents
);

// Public routes
router.get("/", EventController.getEvents);
router.get("/search", EventController.searchEvents);
router.get("/:eventId", EventController.getEventDetails);

// Protected routes
router.post(
  "/create",
  authMiddleware(["event_creator", "admin"]),
  upload.array("images", 10),
  EventController.createEvent
);

router.put(
  "/:eventId",
  authMiddleware(["event_creator", "admin"]),
  filterNullValues,
  upload.array("images", 10),
  EventController.updateEvent
);

router.delete(
  "/:eventId",
  authMiddleware(["admin", "event_creator"]),
  EventController.deleteEvent
);


module.exports = router;
