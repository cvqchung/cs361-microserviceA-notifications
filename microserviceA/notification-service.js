const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3001;
const MAIN_PROGRAM_URL = 'http://localhost:3000/receive-notification'; // Replace with actual main program endpoint

app.use(express.json());

const appointments = [];

// Regex formats for validation
const VALID_DATE_FORMAT = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/; // YYYY-MM-DD
const VALID_TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM (24-hour format)
const VALID_VET_NAME_FORMAT = /^[a-zA-Z\s\.\'-]{1,100}$/; // Letters, spaces, periods, hyphens, apostrophes
const VALID_USER_ID_FORMAT = /^\w+$/; // Assuming alphanumeric user ID

// Helper function to validate appointment data
const validateAppointmentData = ({ user_id, appointment }) => {
    const { date, time, vet_name } = appointment;

    if (!user_id || !appointment) return 'Missing user_id or appointment.';
    if (!VALID_USER_ID_FORMAT.test(user_id)) return 'Invalid user_id format.';
    if (!date || !time || !vet_name) return 'Missing required fields: date, time, or vet_name.';
    if (!VALID_DATE_FORMAT.test(date)) return 'Invalid date format. Use YYYY-MM-DD.';
    if (!VALID_TIME_FORMAT.test(time)) return 'Invalid time format. Use HH:MM (24-hour format).';
    if (!VALID_VET_NAME_FORMAT.test(vet_name)) {
        return 'Vet name must only contain letters, spaces, periods, hyphens, and apostrophes.';
    }
    if (new Date(`${date}T${time}`) <= new Date()) return 'Appointment must be scheduled in the future.';

    return null;
};

// POST /: Log an appointment
app.post('/', (req, res) => {
    try {
        const { user_id, appointment } = req.body;

        const validationError = validateAppointmentData({ user_id, appointment });
        if (validationError) {
            return res.status(400).json({ status: 'error', message: validationError });
        }

        const newAppointment = {
            user_id,
            date: appointment.date,
            time: appointment.time,
            vet_name: appointment.vet_name,
            notified: false
        };
        appointments.push(newAppointment);

        res.status(200).json({
            status: 'success',
            message: 'Appointment logged successfully',
            appointment_details: { user_id, ...appointment }
        });
    } catch (error) {
        console.error('Error in logging appointment:', error.message);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Helper function to send notifications
const sendNotification = async (appointment) => {
    try {
        await axios.post(MAIN_PROGRAM_URL, {
            status: 'success',
            message: 'Notification sent successfully',
            user_id: appointment.user_id,
            appointment_details: {
                date: appointment.date,
                time: appointment.time,
                vet_name: appointment.vet_name
            }
        });
        appointment.notified = true;
        console.log('Notification sent for appointment:', appointment);
    } catch (error) {
        console.error('Failed to send notification for appointment:', error.message);
    }
};

// Notification service
setInterval(() => {
    appointments.forEach(appointment => {
        if (!appointment.notified && isWithin24Hours(appointment.date, appointment.time)) {
            sendNotification(appointment);
        }
    });
}, 5000);

// Check if an appointment is within 24 hours
const isWithin24Hours = (appointmentDate, appointmentTime) => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    return appointmentDateTime - now <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
};

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Notification service is running'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Notification Service is running on port ${PORT}`);
});
