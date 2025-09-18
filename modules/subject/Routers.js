const express = require('express');
const { createSubject, createTopic, progressUpdate, progressSummary, progressSubjectsWithTopics, getSubjects } = require('./Controller');
const subjectRoutes = express.Router();


subjectRoutes.post('/create-subject', createSubject);
subjectRoutes.post('/create-topic', createTopic);
subjectRoutes.put('/progress/update', progressUpdate);
subjectRoutes.get('/', getSubjects);
subjectRoutes.get('/progress/summary', progressSummary);
subjectRoutes.get('/progress/topics-status', progressSubjectsWithTopics);


module.exports = subjectRoutes;