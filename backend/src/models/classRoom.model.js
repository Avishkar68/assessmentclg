const mongoose = require('mongoose');

const classRoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required.'],
      unique: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ClassRoom', classRoomSchema);
