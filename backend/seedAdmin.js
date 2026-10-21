const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusboard_db';

async function forceSeedAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const email = 'superadmin@faculty.campusboard.edu';
    const rawPassword = 'AdminRoot123!';

    // Remove older/conflicting instance
    await User.deleteOne({ email });

    const admin = new User({
      name: 'CampusBoard Root Faculty',
      email: email,
      password: rawPassword,
      role: 'Admin'
    });

    await admin.save();

    console.log('\n=============================================');
    console.log(' Root Admin successfully initialized:');
    console.log(` Email:    ${email}`);
    console.log(` Password: ${rawPassword}`);
    console.log(' Domain:   @faculty.campusboard.edu enforced');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

forceSeedAdmin();