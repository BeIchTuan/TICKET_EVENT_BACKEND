const Event = require('../models/EventModel');
const Ticket = require('../models/TicketModel');
const EmailService = require('./EmailService');

class ReminderService {
  static async sendEventReminders() {
    try {
      console.log('Starting to send event reminders...');
      
      // Tìm các sự kiện diễn ra trong vòng 24h tới
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const today = new Date();
      
      const upcomingEvents = await Event.find({
        date: {
          $gte: today,
          $lte: tomorrow
        },
        status: 'active',
        isDeleted: false
      });

      console.log(`Found ${upcomingEvents.length} upcoming events`);

      for (const event of upcomingEvents) {
        // Tìm tất cả vé đã thanh toán của sự kiện
        const tickets = await Ticket.find({
          eventId: event._id,
          paymentStatus: 'paid'
        }).populate('buyerId');

        console.log(`Processing ${tickets.length} tickets for event: ${event.name}`);

        for (const ticket of tickets) {
          try {
            // Tạo nội dung email
            const emailContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                  }
                  .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                  }
                  .header {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px;
                  }
                  .content {
                    padding: 20px;
                  }
                  .event-details {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                  }
                  .event-info {
                    margin: 10px 0;
                  }
                  .booking-code {
                    background-color: #e9ecef;
                    padding: 15px;
                    text-align: center;
                    border-radius: 5px;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 20px 0;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    color: #6c757d;
                  }
                  .highlight {
                    color: #007bff;
                  }
                </style>
              </head>
              <body>
                <div class="email-container">
                  <div class="header">
                    <h1 style="color: #007bff; margin: 0;">Nhắc nhở sự kiện</h1>
                    <p style="margin: 10px 0 0 0;">Sự kiện của bạn sẽ diễn ra vào ngày mai</p>
                  </div>
                  
                  <div class="content">
                    <p>Xin chào <strong>${ticket.buyerId.name}</strong>,</p>
                    
                    <p>Chúng tôi gửi email này để nhắc nhở bạn về sự kiện sắp diễn ra:</p>
                    
                    <div class="event-details">
                      <h2 style="color: #007bff; margin-top: 0;">${event.name}</h2>
                      <div class="event-info">
                        <p><strong>🗓 Thời gian:</strong> ${event.date.toLocaleString('vi-VN')}</p>
                        <p><strong>📍 Địa điểm:</strong> ${event.location}</p>
                      </div>
                    </div>

                    <div class="booking-code">
                      <p style="margin: 0;">Mã vé của bạn</p>
                      <span class="highlight">${ticket.bookingCode}</span>
                    </div>

                    <p><strong>Lưu ý quan trọng:</strong></p>
                    <ul>
                      <li>Vui lòng đến trước giờ diễn ra sự kiện 30 phút</li>
                      <li>Mang theo mã QR code để check-in</li>
                      <li>Giữ điện thoại ở chế độ rung/im lặng trong suốt sự kiện</li>
                    </ul>
                  </div>

                  <div class="footer">
                    <p>Chúc bạn có một sự kiện thật tuyệt vời! 🎉</p>
                    <p>Nếu cần hỗ trợ, vui lòng liên hệ với chúng tôi qua email hoặc hotline</p>
                    <p style="margin-bottom: 0;">© 2024 Ticket Event System. All rights reserved.</p>
                  </div>
                </div>
              </body>
              </html>
            `;

            // Gửi email
            await EmailService.sendEmail({
              to: ticket.buyerId.email,
              subject: `[Nhắc nhở] Sự kiện ${event.name} diễn ra vào ngày mai`,
              html: emailContent
            });

            console.log(`Sent reminder email to ${ticket.buyerId.email}`);
          } catch (emailError) {
            console.error(`Error sending reminder to ${ticket.buyerId.email}:`, emailError);
          }
        }
      }

      console.log('Finished sending event reminders');
    } catch (error) {
      console.error('Error in sendEventReminders:', error);
    }
  }
}

module.exports = ReminderService;
