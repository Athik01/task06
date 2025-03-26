const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

// Create an Express app
const app = express();

// Middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb+srv://dbEsteemJK:qwerty786!A@esteem-jk.wwqurhe.mongodb.net/?retryWrites=true&w=majority&appName=Esteem-JK', { useNewUrlParser: true });

const db = mongoose.connection;

// Handle MongoDB connection events
db.once('open', () => {
  console.log("Database connection successful");
});
db.on('error', console.error.bind(console, 'connection error:'));

// Define a Mongoose schema and model for the user
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema, 'Users_1');

// Sign-up route
app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  const newUser = new User({
    name,
    email,
    password
  });

  newUser.save()
    .then(() => {
      console.log("User registered successfully");
      res.send("Sign Up Successful");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error registering user");
    });
});

// Login route with redirection to home.html
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email, password })
    .then(user => {
      if (user) {
        console.log("User login successful");
        // Redirect to home.html with user details as query parameters
        res.redirect(`/home.html?name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);
      } else {
        res.status(401).send("Login Failed: Incorrect Email or Password");
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send("Error logging in");
    });
});

// Start the server and listen on port 4000
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
