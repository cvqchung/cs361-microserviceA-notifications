const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const MAIN_SERVICE_PORT = 3000;
const MICROSERVICE_URL = 'http://localhost:3001/';

app.use(bodyParser.json());

// Main service endpoint to receive notifications from microservice
app.post('/receive-notification', (req, res) => {
    console.log('Main service received notification:', req.body);
    // code here to display notification (it is in req.body)
    res.status(200).json({ status: 'success', message: 'Notification received' });
});


// Test the server connection
async function testServerConnection() {
    console.log("Testing server connection...");
    try {
        const response = await axios.get(MICROSERVICE_URL);
        console.log(response.data);
    } catch (error) {
        console.error("Error connecting to server:", error.message);
    }
}

// Test a valid request to the microservice (and notification)
async function testValidRequest() {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const validData = {
        "user_id": "user123",
        "appointment": {
            "date": futureDate.toISOString().split('T')[0],
            "time": futureDate.toTimeString().slice(0, 5),
            "vet_name": "Dr. Jane Doe"
        }
    };

    console.log("Testing valid request...");
    try {
        const response = await axios.post(MICROSERVICE_URL, validData);
        console.log(response.data);
    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
        }
    }
}


// Test an invalid request to the microservice
async function testInvalidRequest() {
    const invalidData = {
        "user_id": "user123",
        "appointment": {
            "date": "2024-11-18",
            "time": "12:00",
            "vet_name": "Dr. Jane Doe"
        }
    };

    console.log("Testing invalid request...");
    try {
        const response = await axios.post(MICROSERVICE_URL, invalidData);
        console.log(response.data);
    } catch (error) {
        if (error.response) {
            console.log(error.response.data);
        }
    }
}

// Main function to run all tests
async function runTests() {
    console.log("Starting test program...");

    await testServerConnection();
    await testValidRequest();
    await testInvalidRequest();

    console.log("Tests completed. Waiting for any notifications...");
    setTimeout(() => {
        process.exit(0);
    }, 10000); // Wait for 10 seconds before exiting
}


// Start the main service
const server = app.listen(MAIN_SERVICE_PORT, () => {
    console.log(`Main service (test) listening on port ${MAIN_SERVICE_PORT}`);
    runTests();
});

