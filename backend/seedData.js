const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const Task = require('./models/Task');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusboard_db';

const FACULTY_PASSWORD = 'FacultyPass123!';
const STUDENT_PASSWORD = 'StudentPass123!';

async function seedData() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully.');

    // 1. Clear existing collections
    console.log('Clearing existing tasks, projects, and users...');
    await Task.deleteMany({});
    await Workspace.deleteMany({});
    await User.deleteMany({});

    // 2. Users: one faculty guide + six students
    const faculty = await User.create({ name: 'Dr. Meera Iyer', email: 'meera.iyer@faculty.campusboard.edu', password: FACULTY_PASSWORD, role: 'Admin' });
    const student = (name, email) => User.create({ name, email, password: STUDENT_PASSWORD, role: 'Member' });
    const aarav = await student('Aarav Mehta', 'aarav.mehta@student.campusboard.edu');
    const diya = await student('Diya Shah', 'diya.shah@student.campusboard.edu');
    const kabir = await student('Kabir Joshi', 'kabir.joshi@student.campusboard.edu');
    const isha = await student('Isha Nair', 'isha.nair@student.campusboard.edu');
    const rohan = await student('Rohan Desai', 'rohan.desai@student.campusboard.edu');
    const sneha = await student('Sneha Kulkarni', 'sneha.kulkarni@student.campusboard.edu');
    console.log('Seeded 1 faculty member and 6 students.');

    // 3. Projects (stored in the "workspaces" collection)
    const p1 = await Workspace.create({
      name: 'Smart Attendance System — Team 7',
      description: 'QR-code based attendance with a Node.js API and an analytics dashboard.',
      owner: faculty._id,
      members: [faculty._id, aarav._id, diya._id]
    });
    const p2 = await Workspace.create({
      name: 'Library Management Portal — Team 3',
      description: 'Open-source book issue/return system with fine calculation.',
      owner: faculty._id,
      members: [faculty._id, kabir._id, isha._id]
    });
    const p3 = await Workspace.create({
      name: 'Campus Events Chatbot — Team 5',
      description: 'Rasa-based chatbot answering questions about campus events.',
      owner: faculty._id,
      members: [faculty._id, rohan._id, sneha._id, aarav._id]
    });
    console.log('Seeded 3 projects.');

    const daysAgo = (days) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d;
    };
    const repo = (slug) => `https://github.com/campusboard-demo/${slug}`;

    // 4. Tasks across the four stages: To Do -> In Progress -> Under Review -> Completed
    const tasks = [
      // --- Project 1: Smart Attendance System ---
      { title: 'Software Requirements Specification (SRS)', description: 'IEEE 830 style SRS with functional and non-functional requirements.', status: 'Completed', priority: 'High', workspace: p1._id, assignedTo: diya._id, docUrl: 'https://docs.google.com/document/d/srs-team7', grade: 88, feedback: 'Clear scope. Add measurable performance requirements.', reviewedBy: faculty._id, createdAt: daysAgo(6), updatedAt: daysAgo(4) },
      { title: 'ER Diagram & MongoDB Schema', description: 'Model students, classes, sessions and attendance records.', status: 'Completed', priority: 'High', workspace: p1._id, assignedTo: aarav._id, repoUrl: repo('smart-attendance'), grade: 92, feedback: 'Good use of references for attendance records.', reviewedBy: faculty._id, createdAt: daysAgo(6), updatedAt: daysAgo(3) },
      { title: 'QR Code Generation API', description: 'Express endpoint that issues time-limited QR codes per lecture.', status: 'Under Review', priority: 'High', workspace: p1._id, assignedTo: aarav._id, repoUrl: repo('smart-attendance'), createdAt: daysAgo(4), updatedAt: daysAgo(1),
        comments: [{ author: aarav._id, text: 'API is ready for review, see /routes/qr.js in the repo.' }] },
      { title: 'Attendance Dashboard UI', description: 'Chart of attendance percentage per subject.', status: 'In Progress', priority: 'Medium', workspace: p1._id, assignedTo: diya._id, createdAt: daysAgo(3), updatedAt: daysAgo(1) },
      { title: 'Unit Tests with Jest', description: 'Cover the QR and attendance endpoints.', status: 'To Do', priority: 'Medium', workspace: p1._id, assignedTo: aarav._id, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
      { title: 'Mid-Semester Presentation', description: 'Slides covering problem, architecture and demo.', status: 'To Do', priority: 'Low', workspace: p1._id, assignedTo: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) },

      // --- Project 2: Library Management Portal ---
      { title: 'Literature Survey of Open-Source ILS', description: 'Compare Koha, Evergreen and OpenBiblio.', status: 'Completed', priority: 'Medium', workspace: p2._id, assignedTo: isha._id, docUrl: 'https://docs.google.com/document/d/lit-survey-team3', grade: 79, feedback: 'Good comparison; cite licence differences (GPL vs MIT).', reviewedBy: faculty._id, createdAt: daysAgo(7), updatedAt: daysAgo(5) },
      { title: 'Book Issue / Return Module', description: 'REST endpoints and UI for issuing and returning books.', status: 'Under Review', priority: 'High', workspace: p2._id, assignedTo: kabir._id, repoUrl: repo('library-portal'), createdAt: daysAgo(5), updatedAt: daysAgo(1),
        comments: [{ author: kabir._id, text: 'Moved to review. Fine calculation is in utils/fines.js.' }, { author: faculty._id, text: 'Will review on Friday. Please add a README with setup steps.' }] },
      { title: 'Fine Calculation Logic', description: 'Rs 2/day after the due date, capped at the book price.', status: 'In Progress', priority: 'Medium', workspace: p2._id, assignedTo: isha._id, createdAt: daysAgo(3), updatedAt: daysAgo(1) },
      { title: 'Deploy on Render with MongoDB Atlas', description: 'Public demo URL for the evaluation panel.', status: 'To Do', priority: 'Low', workspace: p2._id, assignedTo: kabir._id, createdAt: daysAgo(1), updatedAt: daysAgo(1) },

      // --- Project 3: Campus Events Chatbot ---
      { title: 'Problem Statement & Objectives', description: 'One-page abstract approved by the guide.', status: 'Completed', priority: 'High', workspace: p3._id, assignedTo: sneha._id, docUrl: 'https://docs.google.com/document/d/abstract-team5', grade: 85, feedback: 'Approved. Narrow the scope to the cultural and technical fests.', reviewedBy: faculty._id, createdAt: daysAgo(7), updatedAt: daysAgo(6) },
      { title: 'Intent & Entity Training Data', description: 'At least 20 intents with sample utterances.', status: 'In Progress', priority: 'High', workspace: p3._id, assignedTo: rohan._id, repoUrl: repo('events-chatbot'), createdAt: daysAgo(4), updatedAt: daysAgo(1) },
      { title: 'Events Database Integration', description: 'Connect the chatbot actions to the events collection.', status: 'In Progress', priority: 'Medium', workspace: p3._id, assignedTo: aarav._id, createdAt: daysAgo(3), updatedAt: daysAgo(2) },
      { title: 'Usability Testing with 10 Students', description: 'Collect SUS scores and feedback.', status: 'To Do', priority: 'Medium', workspace: p3._id, assignedTo: sneha._id, createdAt: daysAgo(2), updatedAt: daysAgo(2) },
      { title: 'Final Project Report', description: 'University format report with plagiarism check.', status: 'To Do', priority: 'High', workspace: p3._id, assignedTo: null, createdAt: daysAgo(1), updatedAt: daysAgo(1) }
    ];

    for (const t of tasks) {
      const doc = new Task({ ...t, createdBy: faculty._id });
      // Preserve custom timestamps for realistic analytics
      doc.createdAt = t.createdAt;
      doc.updatedAt = t.updatedAt;
      await doc.save({ timestamps: false });
    }
    console.log(`Seeded ${tasks.length} tasks across 3 projects.`);

    console.log('\n=============================================');
    console.log('--- CAMPUSBOARD SEEDING COMPLETE ---');
    console.log(`Faculty:  meera.iyer@faculty.campusboard.edu  /  ${FACULTY_PASSWORD}`);
    console.log(`Students (password for all: ${STUDENT_PASSWORD}):`);
    console.log('  aarav.mehta, diya.shah, kabir.joshi, isha.nair, rohan.desai, sneha.kulkarni  @student.campusboard.edu');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
