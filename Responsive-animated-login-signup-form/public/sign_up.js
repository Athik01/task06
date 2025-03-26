const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For hashing passwords

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://dbEsteemJK:qwerty786!A@esteem-jk.wwqurhe.mongodb.net/?retryWrites=true&w=majority&appName=Esteem-JK', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.once('open', function () {
    console.log("Database Connection Successful");
});
db.on('error', console.error.bind(console, 'connection error:'));

// Define the User schema and model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    otp: { type: String },
    age: { type: Number },
    password: { type: String, required: true },
    confirm_password: { type: String, required: true },
    type: { type: String, default: 'user' }
}, { collection: 'Users_1' });

const User = mongoose.model('User', userSchema);

// Route for user signup
app.post('/sign_up', async (req, res) => {
    try {
        const { logname, logemail, logpass, logpass: confirm_password } = req.body;

        // Check if passwords match
        if (logpass !== confirm_password) {
            return res.status(400).send("Passwords do not match");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(logpass, 10);

        // Create a new user
        const newUser = new User({
            name: logname,
            email: logemail,
            password: hashedPassword,
            confirm_password: hashedPassword
        });

        // Save the user to the database
        await newUser.save();
        res.status(201).send("User signed up successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error signing up user");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
