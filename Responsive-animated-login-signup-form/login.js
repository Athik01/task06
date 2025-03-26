const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt'); // For comparing passwords

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
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

// Route for user login
app.post('/login', async (req, res) => {
    try {
        const { logemail, logpass } = req.body;

        // Find the user by email
        const user = await User.findOne({ email: logemail });
        if (!user) {
            return res.status(400).send("User not found");
        }

        // Compare the password
        const isMatch = await bcrypt.compare(logpass, user.password);
        if (!isMatch) {
            return res.status(400).send("Invalid credentials");
        }

        res.status(200).send("Login successful");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error logging in user");
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
