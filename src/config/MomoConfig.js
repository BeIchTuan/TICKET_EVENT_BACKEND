const momoConfig = {
  PARTNER_CODE: "MOMO",
  ACCESS_KEY: "F8BBA842ECF85",
  SECRET_KEY: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  API_ENDPOINT: "https://test-payment.momo.vn/v2/gateway/api",
  REDIRECT_URL: "https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b",
  IPN_URL: "http://localhost:3001/api/payment/callback"
};

module.exports = momoConfig;