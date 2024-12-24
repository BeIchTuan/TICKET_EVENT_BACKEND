const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Kết nối đến in-memory database trước khi chạy test
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

// Xóa tất cả collections sau mỗi test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Đóng kết nối database sau khi chạy xong tất cả test
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});
