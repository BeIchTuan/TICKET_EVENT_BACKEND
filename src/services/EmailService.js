const transporter = require("../config/EmailConfig");
const User = require("../models/UserModel");
const Event = require("../models/EventModel");
const QRCode = require("qrcode");
const bcrypt = require("bcrypt");

class EmailService {
  static async generateQRCodeImage(data) {
    try {
      console.log("Generating QR code for data:", data);
      // Tạo QR code dạng Base64
      const qrCodeBase64 = await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        width: 300,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      console.log("QR code generated successfully");
      return qrCodeBase64;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw error;
    }
  }

  static async sendPaymentSuccessEmail(ticket) {
    try {
      console.log("Starting to send email for ticket:", ticket._id);

      const user = await User.findById(ticket.buyerId);
      const event = await Event.findById(ticket.eventId);

      console.log("User data:", user);
      console.log("Event data:", event);

      if (!user || !user.email) {
        throw new Error("User or user email not found");
      }

      if (!event) {
        throw new Error("Event not found");
      }

      // Tạo QR code mới từ booking code
      console.log("Generating QR code for booking code:", ticket.bookingCode);
      const qrCodeImage = await this.generateQRCodeImage(ticket.bookingCode);
      console.log("QR code image length:", qrCodeImage?.length || 0);

      // Format ngày giờ theo định dạng Việt Nam
      const eventDate = new Date(event.date).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "full",
        timeStyle: "short",
      });

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50; text-align: center;">Xác nhận thanh toán vé thành công</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p>Xin chào <strong>${user.name}</strong>,</p>
            <p>Cảm ơn bạn đã đặt vé sự kiện <strong>${event.name}</strong>.</p>
            
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Chi tiết vé của bạn:</h3>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Mã đặt vé:</strong> ${
                  ticket.bookingCode
                }</li>
                <li style="margin: 10px 0;"><strong>Sự kiện:</strong> ${
                  event.name
                }</li>
                <li style="margin: 10px 0;"><strong>Thời gian:</strong> ${eventDate}</li>
                <li style="margin: 10px 0;"><strong>Địa điểm:</strong> ${
                  event.location
                }</li>
                <li style="margin: 10px 0;"><strong>Giá vé:</strong> ${event.price?.toLocaleString(
                  "vi-VN"
                )}đ</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <p><strong>Vui lòng sử dụng mã QR code này để check-in tại sự kiện:</strong></p>
              <img src="${qrCodeImage}" alt="QR Code" style="width: 200px; height: 200px;"/>
              <p style="margin-top: 10px; font-size: 12px; color: #666;">Mã booking: ${
                ticket.bookingCode
              }</p>
            </div>

            <p style="color: #2c3e50;">Chúc bạn có trải nghiệm tuyệt vời tại sự kiện!</p>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666;">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: {
          name: "Ticket Event System",
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: `[Ticket Event] Xác nhận thanh toán vé sự kiện ${event.name}`,
        html: emailContent,
        attachDataUrls: true, // Quan trọng: cho phép gửi data URL trong email
      };

      console.log("Sending email to:", user.email);
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      return info;
    } catch (error) {
      console.error("Error in sendPaymentSuccessEmail:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  static async sendEmail({ to, subject, html }) {
    try {
      const mailOptions = {
        from: {
          name: "Ticket Event System",
          address: process.env.EMAIL_USER,
        },
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.messageId);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}

module.exports = EmailService;
