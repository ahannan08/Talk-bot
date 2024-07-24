import mongoose  from 'mongoose';
import bcrypt from'bcryptjs';
import User from'./models/User.js'; // Adjust the path as needed

mongoose.connect("mongodb+srv://messi:messi@ntcluster.4xpi75r.mongodb.net/?retryWrites=true&w=majority&appName=NTcluster", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected");
  createAdminUser();
}).catch(err => console.error(err));

const createAdminUser = async () => {
  const username = 'admin1';
  const password = 'admin';

  try {
    let user = await User.findOne({ username });
    if (user) {
      console.log('Admin user already exists');
      mongoose.connection.close();
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, password: hashedPassword, isAdmin: true });
    await user.save();

    console.log('Admin user created');
    mongoose.connection.close();
  } catch (err) {
    console.error(err.message);
    mongoose.connection.close();
  }
};
