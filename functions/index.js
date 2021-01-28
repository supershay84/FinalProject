const functions = require("firebase-functions");
const express = require('express');
const app = express();
const FBAuth = require('./utilities/auth');
const { getAllScreams, postScream } = require('./controllers/screams');
const { signup, login, uploadImage, addUserDetails } = require('./controllers/users');
// app.use(express.json());

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// ROUTES
app.get('/screams', getAllScreams );
app.post('/scream', FBAuth, postScream);
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image',FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);

exports.api = functions.region('us-east4').https.onRequest(app);
