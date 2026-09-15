const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("Trying to connect to MongoDB...");

  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error(error);
  }
};

module.exports = connectDB;