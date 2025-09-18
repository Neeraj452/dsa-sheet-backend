const { mongoose } = require("mongoose");
const Subject = require("../../models/subject");
const Topic = require("../../models/topic");
const UserSubjectProgress = require("../../models/userSubjectProgress");

const createSubject = async (req, res) => {
  const { subject = [] } = req.body;
  try {
    const result = await Subject.insertMany(subject);
    res.status(201).json({ status: 201, message: 'Subjects created successfully', result });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

const createTopic = async (req, res) => {
  const { topic } = req.body;
  try {
    const result = await Topic.insertMany(topic);
    res.status(201).json({ status: 201, message: 'Topics created successfully', result });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().lean();
    if (!subjects.length) {
      return res.status(404).json({ status: 404, message: 'No subjects found' });
    }
    res.status(200).json({ status: 200, data:subjects });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

const progressUpdate = async (req, res) => {
  const { subjectId, topicId, status } = req.body;
  const userId = req.user?.userId;

  if (!userId || !subjectId || !topicId || !status) {
    return res.status(400).json({ status: 400, error: 'Missing required fields' });
  }

  try {
    const completedAt = status === 'done' ? new Date() : null;

    let progressDoc = await UserSubjectProgress.findOne({ userId, subjectId });

    if (!progressDoc) {
      progressDoc = new UserSubjectProgress({
        userId,
        subjectId,
        topics: [{ topicId, status, completedAt }],
        updatedAt: new Date(),
      });
    } else {
      const topicIndex = progressDoc.topics.findIndex(t => t.topicId.toString() === topicId);
      if (topicIndex > -1) {
        progressDoc.topics[topicIndex].status = status;
        progressDoc.topics[topicIndex].completedAt = completedAt;
      } else {
        progressDoc.topics.push({ topicId, status, completedAt });
      }
      progressDoc.updatedAt = new Date();
    }

    await progressDoc.save();

    res.status(200).json({ status: 200, message: 'Progress updated successfully', progress: progressDoc });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

const progressSummary = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).json({ status: 400, error: 'Missing userId' });
  }

  try {
    const result = {
      easy: { total: 0, completed: 0, percentage: 0 },
      medium: { total: 0, completed: 0, percentage: 0 },
      hard: { total: 0, completed: 0, percentage: 0 }
    };

    const totalCountsByLevel = await Topic.aggregate([
      { $group: { _id: { $toLower: "$level" }, totalCount: { $sum: 1 } } }
    ]);

    totalCountsByLevel.forEach(item => {
      const level = item._id;
      if (result[level]) result[level].total = item.totalCount;
    });

    const completedTopicIds = await UserSubjectProgress.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$topics" },
      { $match: { "topics.status": "done" } },
      { $group: { _id: "$topics.topicId" } }
    ]);

    const completedTopicIdList = completedTopicIds.map(t => t._id);

    const completedCountsByLevel = await Topic.aggregate([
      { $match: { _id: { $in: completedTopicIdList } } },
      { $group: { _id: { $toLower: "$level" }, completedCount: { $sum: 1 } } }
    ]);

    completedCountsByLevel.forEach(item => {
      const level = item._id;
      if (result[level]) result[level].completed = item.completedCount;
    });

    ['easy', 'medium', 'hard'].forEach(level => {
      const { total, completed } = result[level];
      result[level].percentage = total ? parseFloat(((completed / total) * 100).toFixed(2)) : 0;
    });

    res.status(200).json({ status: 200, data: result });
  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};

const progressSubjectsWithTopics = async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).json({ status: 400, error: 'Missing userId' });
  }

  try {
    const subjects = await Subject.find().lean();

    if (subjects.length === 0) {
      return res.status(404).json({ status: 404, message: 'No subjects found', subjects: [] });
    }

    const progressDoc = await UserSubjectProgress.find({ userId });

    const progressMap = {};
    progressDoc.forEach(doc => {
      progressMap[doc.subjectId.toString()] = {};
      doc.topics.forEach(t => {
        progressMap[doc.subjectId.toString()][t.topicId.toString()] = t.status;
      });
    });

    const subjectsWithTopics = [];

    for (const subject of subjects) {
      const topics = await Topic.find({ subjectId: subject._id }).lean();

      const topicListWithStatus = topics.map(topic => ({
        ...topic,
        status: (progressMap[subject._id.toString()]?.[topic._id.toString()] === 'done')
          ? 'done'
          : 'pending'
      }));

      const subjectStatus = topicListWithStatus.every(t => t.status === 'done')
        ? 'done'
        : 'pending';

      subjectsWithTopics.push({
        subjectId: subject._id,
        subjectName: subject.name,
        status: subjectStatus,
        topics: topicListWithStatus
      });
    }

    res.status(200).json({ status: 200, data: subjectsWithTopics });

  } catch (err) {
    res.status(500).json({ status: 500, error: err.message });
  }
};


module.exports = {
  createSubject,
  createTopic,
  progressUpdate,
  progressSummary,
  progressSubjectsWithTopics,
  getSubjects
};
