var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Threaded discussion on a task (replaces scattered WhatsApp / Slack messages)
var CommentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

var TaskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Under Review', 'Completed'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Links to the student's work (replaces scattered GitHub / Google Drive links)
  repoUrl: {
    type: String,
    trim: true,
    default: ''
  },
  docUrl: {
    type: String,
    trim: true,
    default: ''
  },
  // Faculty review & grading
  grade: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  feedback: {
    type: String,
    trim: true,
    default: ''
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  comments: [CommentSchema]
}, {
  timestamps: true
});

var Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
