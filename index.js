const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Connect to MongoDB with error handling
mongoose.connect('mongodb+srv://jk555817:owais@owaiscluster.ksmooyy.mongodb.net/kalalkothi')
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Define Booking schema and model
const bookingSchema = new mongoose.Schema({
    lawn: String,
    date: String,
    displayDate: String,      // Human-readable date format (e.g., "September 1, 2024")
    name: String,
    phone: String,
    email: String,
    address: String,
    totalAmount: Number,
    discountedAmount: Number,
    advancePaid: Number,
    duePayment: Number,
    additionalServices: String,
});

const Booking = mongoose.model('Booking', bookingSchema);

// Set up middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Serve the home page
app.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find({});
        res.render('index', { bookings });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Server Error');
    }
}); 

// Handle booking form submission
app.post('/book', async (req, res) => {
    try {
        const { lawn, date, name, phone, email, address, totalAmount, discountedAmount, advancePaid, duePayment, additionalServices } = req.body;

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize time to midnight to avoid issues

        // Prevent booking for past dates
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Booking for past dates is not allowed.' });
        }

        // Convert the selected date to an ISO string without time to ensure consistent format
        const formattedDate = selectedDate.toISOString().split('T')[0]; // "YYYY-MM-DD"

        // Check if the lawn is already booked on the selected date
        const existingBooking = await Booking.findOne({ lawn, date: formattedDate });

        if (existingBooking) {
            return res.status(400).json({ message: 'This lawn is already booked on that date.' });
        }

        // Convert the month digit to the month name for display purposes
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        const monthName = monthNames[selectedDate.getMonth()];

        // Format the display date (e.g., "September 1, 2024")
        const displayDate = `${monthName} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;

        // Save the booking with the formatted date and display date
        const newBooking = new Booking({
            lawn,
            date: formattedDate, // ISO formatted date for logical operations
            displayDate,         // Formatted date string for display
            name,
            phone,
            email,
            address,
            totalAmount,
            discountedAmount,
            advancePaid,
            duePayment,
            additionalServices
        });

        await newBooking.save();
        res.sendStatus(200);
    } catch (error) {
        console.error('Error saving booking:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Route to delete a booking
app.delete('/cancel/:id', async (req, res) => {
    try {
        const result = await Booking.deleteOne({ _id: req.params.id });
        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'Booking canceled successfully.' });
        } else {
            res.status(404).json({ message: 'Booking not found.' });
        }
    } catch (err) {
        console.error('Error deleting booking:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
