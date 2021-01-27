const functions = require("firebase-functions");
const express = require('express');
const app = express();
const FBAuth = require('./utilities/fbAuth');
const { getAllScreams, postScream } = require('./handlers/screams');
const { signup, login, uploadImage } = require('./handlers/users');

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// SCREAM! ROUTES
app.get('/screams', getAllScreams );
app.post('/scream', FBAuth, postScream);
// USER ROUTES
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image',FBAuth, uploadImage);

exports.api = functions.region('us-east4').https.onRequest(app);
