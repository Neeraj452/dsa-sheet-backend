const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  name: { type: String, required: true },
  leetcodeLink: { type: String },
  youtubeLink: { type: String },
  articleLink: { type: String },
  level: { type: String },   
  status: { type: String, default: 'pending' },  
  createdAt: { type: Date, default: Date.now },
});

const Topic = mongoose.model('Topic', TopicSchema);
module.exports = Topic;