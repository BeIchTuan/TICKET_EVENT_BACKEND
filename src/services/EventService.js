const Event = require("../models/EventModel");
const User = require("../models/UserModel");
const Category = require("../models/CategoryModel");
const {
  deleteFromCloudinary,
  extractPublicId,
} = require("../utils/UploadImage");

class EventService {
  static async createEvent(eventData) {
    try {
      console.log("Input eventData:", JSON.stringify(eventData, null, 2));

      // Kiểm tra collaborators có role event_creator
      if (eventData.collaborators?.length) {
        const collaborators = await User.find({
          _id: { $in: eventData.collaborators },
          role: "event_creator",
        });

        if (collaborators.length !== eventData.collaborators.length) {
          throw new Error("Some collaborators are not event creators");
        }
      }

      // Validate categoryId
      const category = await Category.findById(eventData.categoryId);
      if (!category) {
        throw new Error("Category not found");
      }

      // Validate date
      const eventDate = new Date(eventData.date);
      if (eventDate < new Date()) {
        throw new Error("Event date must be in the future");
      }

      // Validate price and maxAttendees
      if (eventData.price < 0) {
        throw new Error("Price must be positive");
      }
      if (eventData.maxAttendees < 0) {
        throw new Error("Maximum attendees must be positive");
      }

      const event = new Event(eventData);

      // Validate thủ công
      const validationError = event.validateSync();
      if (validationError) {
        console.log("Validation errors:", validationError.errors);
        throw validationError;
      }

      console.log("Event before save:", event);
      const savedEvent = await event.save();
      return savedEvent;
    } catch (error) {
      console.log("Detailed error:", {
        message: error.message,
        errors: error.errors,
        code: error.code,
        details: error.errInfo?.details,
      });
      throw error;
    }
  }

  static async getEvents(filters = {}) {
    try {
      const query = { isDeleted: false };

      if (filters.status) query.status = filters.status;
      if (filters.date) query.date = filters.date;
      if (filters.categoryId) query.categoryId = filters.categoryId;
      if (filters.createdBy) query.createdBy = filters.createdBy;

      return await Event.find(query)
        .sort({ createdAt: -1 })
        .populate("categoryId", "name")
        .populate("createdBy", "name")
        .populate("collaborators", "_id name")
        .exec()
        // đổi tên categoryId thành category trong data trả về
        .then((events) =>
          events.map((event) => {
            const eventObj = event.toObject();
            eventObj.category = eventObj.categoryId;
            delete eventObj.categoryId;
            return eventObj;
          })
        );
    } catch (error) {
      throw error;
    }
  }

  static async updateEvent(
    eventId,
    userId,
    updateData,
    newImages,
    imagesToDelete
  ) {
    try {
      const event = await Event.findOne({
        _id: eventId,
        createdBy: userId,
        isDeleted: false,
      });

      if (!event) throw new Error("Event not found or unauthorized");

      if (imagesToDelete && imagesToDelete.length > 0) {
        if (typeof imagesToDelete === "string") {
          imagesToDelete = JSON.parse(imagesToDelete);
        }

        for (const image of imagesToDelete) {
          if (typeof image === "string") {
            const publicId = extractPublicId(image);
            console.log("Extracted Public ID:", publicId);

            await deleteFromCloudinary(publicId);

            const index = event.images.indexOf(image);
            if (index > -1) event.images.splice(index, 1);
          } else {
            console.error("Invalid image URL:", image);
          }
        }
      }

      // Thêm ảnh mới vào danh sách ảnh
      if (newImages && newImages.length > 0) {
        event.images.push(...newImages);
      }

      // Kiểm tra collaborators nếu được cập nhật
      if (updateData.collaborators) {
        const collaborators = await User.find({
          _id: { $in: updateData.collaborators },
          role: "event_creator",
        });

        if (collaborators.length !== updateData.collaborators.length) {
          throw new Error("Some collaborators are not event creators");
        }
      }

      Object.assign(event, updateData);
      await event.save();
      return event;
    } catch (error) {
      throw error;
    }
  }

  static async deleteEvent(eventId, userId) {
    try {
      const event = await Event.findOneAndUpdate(
        {
          _id: eventId,
          createdBy: userId,
          isDeleted: false,
          status: "active",
        },
        { isDeleted: true, status: "canceled" },
        { new: true }
      );

      if (!event) throw new Error("Event not found or unauthorized");
      return event;
    } catch (error) {
      throw error;
    }
  }

  static async getEventDetails(eventId) {
    try {
      const event = await Event.findOne({ _id: eventId, isDeleted: false })
        .populate("collaborators", "_id name avatar studentId")
        .populate("createdBy", "_id name avatar studentId")
        .populate({
          path: "createdBy",
          select: "_id name avatar studentId",
        })
        .populate("categoryId", "name");

      // đổi tên categoryId thành category trong data trả về
      if (event) {
        const eventObj = event.toObject();
        eventObj.category = eventObj.categoryId;
        delete eventObj.categoryId;
        return eventObj;
      }

      if (!event) throw new Error("Event not found");
      return event;
    } catch (error) {
      throw error;
    }
  }

  static async searchEvents(searchParams) {
    try {
      const query = { isDeleted: false };

      if (searchParams.name) {
        query.$text = { $search: searchParams.name };
      }
      if (searchParams.location) {
        query.location = { $regex: searchParams.location, $options: "i" };
      }
      if (searchParams.date) {
        query.date = searchParams.date;
      }
      if (searchParams.categoryId) {
        query.categoryId = searchParams.categoryId;
      }
      if (searchParams.status) {
        query.status = searchParams.status;
      }

      return await Event.find(query)
        .populate("categoryId", "name")
        .populate("createdBy", "_id name");
    } catch (error) {
      throw error;
    }
  }

  static async getManagedEvents(userId) {
    try {
      const events = await Event.find({
        $or: [{ createdBy: userId }, { collaborators: userId }],
        isDeleted: false,
      })
        .populate("createdBy", "_id name avatar studentId")
        .populate("collaborators", "_id name")
        .populate({
          path: "categoryId",
          model: "Category",
          select: "_id name",
        })
        .exec();

      return events.map((event) => ({
        ...event.toObject(),
        category: event.categoryId.map((category) => ({
          _id: category._id,
          name: category.name,
        })),
        categoryId: undefined, 
      }));
    } catch (error) {
      throw new Error("Error fetching managed events: " + error.message);
    }
  }
}

module.exports = EventService;
