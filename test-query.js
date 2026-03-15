const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/smart-attendance").then(async () => {
  const data = await mongoose.connection.collection("TimeTable").find().toArray();
  console.log(JSON.stringify(data.slice(0, 2), null, 2));
  process.exit(0);
});
