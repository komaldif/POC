const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contact: { type: Number, required: true },
  password: { type: String, required: true },
  confirmpassword: { type: String, required: true },
  orgainisation: { type: String, required: true },
  designation: { type: String, required: true },
  secretcode: { type: String },
  qrvalue: { type: String },
  token: { type: String },
});

//model in the schema defines the structure of the doctument.
const Users = mongoose.model("Users", userSchema);
module.exports = Users;
