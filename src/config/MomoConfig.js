const momoConfig = {
  PARTNER_CODE: "MOMO",
  ACCESS_KEY: "F8BBA842ECF85",
  SECRET_KEY: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  API_ENDPOINT: "https://test-payment.momo.vn/v2/gateway/api",
  // REDIRECT_URL: "https://ticket-deeplink.vercel.app/ticket", // mobile
  REDIRECT_URL: "https://nguyencongtu2004.github.io/event-ticket-deploy/#/ticket", // web
  IPN_URL: "https://18a0-1-54-35-8.ngrok-free.app/api/payment/callback",
};

module.exports = momoConfig;