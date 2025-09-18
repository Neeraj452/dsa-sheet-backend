const mongoose = require('mongoose');

const TopicProgressSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'done'], default: 'pending' },
  completedAt: { type: Date, default: null }
});

const UserSubjectProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  
  topics: [TopicProgressSchema],

  updatedAt: { type: Date, default: Date.now }
});

// Ensure a user has only one progress document per subject
UserSubjectProgressSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

const UserSubjectProgress = mongoose.model('UserSubjectProgress', UserSubjectProgressSchema);
module.exports = UserSubjectProgress;
