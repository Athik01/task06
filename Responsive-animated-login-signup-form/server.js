const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcryptjs'); // Changed from bcrypt to bcryptjs
const multer = require('multer');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const app = express();
const client = require('prom-client');
const register = new client.Registry();

// Collect default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom Metrics Example
const requestCounter = new client.Counter({
  name: 'node_app_requests_total',
  help: 'Total number of requests',
});
register.registerMetric(requestCounter);

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect('mongodb+srv://dbEsteemJK:qwerty786!A@esteem-jk.wwqurhe.mongodb.net/?retryWrites=true&w=majority&appName=Esteem-JK', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Database connection successful"))
  .catch(err => console.error("Database connection error:", err));

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'mohamedathikr.22msc@kongu.edu',
    pass: 'vkff fnsy cfea qhun'
  }
});

// User schema and model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  age: Number,
  type: String,
  otp: String,
  otpExpires: Date
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

const User = mongoose.model('User', userSchema, 'Users_1');

// Doctor schema and model
const doctorSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  serviceFee: String,
  availability: String,
  description: String,
  contactDetails: String,
  organization: String,
  experience: Number,
  name: String,
  image: String, 
  specialization: String 
});

const Doctor = mongoose.model('Doctor', doctorSchema, 'Doctors');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Send OTP route
app.get('/send-otp', async (req, res) => {
  const email = req.query.email;
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

  try {
    const user = await User.findOneAndUpdate({ email }, { otp, otpExpires }, { new: true, upsert: true });

    if (user) {
      const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 15 minutes.`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending OTP:', error);
          res.status(500).json({ success: false, message: 'Failed to send OTP' });
        } else {
          res.json({ success: true });
        }
      });
    } else {
      res.status(400).json({ success: false, message: 'Failed to generate OTP' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify OTP route
app.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  requestCounter.inc();

  try {
    const user = await User.findOne({ email });
    if (user && user.otp === otp && new Date() <= user.otpExpires) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User signup route
app.post('/signup', async (req, res) => {
  const { name, email, password, age, type, otp } = req.body;
  const normalizedType = (type || '').toLowerCase();

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser || existingUser.otp !== otp || new Date() > existingUser.otpExpires) {
      return res.status(400).send("Invalid or expired OTP");
    }

    existingUser.name = name;
    existingUser.password = password;
    existingUser.age = age;
    existingUser.type = normalizedType;

    await existingUser.save();

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    if (normalizedType === 'citizen') {
      res.redirect(`${baseUrl}/home.html?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    } else if (normalizedType === 'consultant') {
      res.redirect(`${baseUrl}/doctor.html?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    } else {
      res.status(400).send("Invalid user type");
    }
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).send("Error updating user");
  }
});

// User login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      const normalizedType = (user.type || '').toLowerCase();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      if (normalizedType === 'citizen') {
        res.redirect(`${baseUrl}/home.html?name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);
      } else if (normalizedType === 'consultant') {
        res.redirect(`${baseUrl}/doctor.html?name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);
      } else {
        res.status(400).send("Invalid user type");
      }
    } else {
      res.status(401).send("Login Failed: Incorrect Email or Password");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error logging in");
  }
});

// Get all doctors route
app.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json({ doctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).send("Error fetching doctors");
  }
});

const PORT = process.env.PORT || 3000; // Change from 4000 to 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

