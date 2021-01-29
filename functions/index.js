const functions = require("firebase-functions");
const express = require('express');
const app = express();
const FBAuth = require('./utilities/auth');
const { getAllScreams,
        postScream,
        getScream,
        commentScream,
        likeScream,
        unlikeScream,
        deleteScream
       } = require('./controllers/screams');
const { 
        signup, 
        login, 
        uploadImage, 
        addUserDetails, 
        getUser
      } = require('./controllers/users');
// app.use(express.json());

// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// DATA ROUTES
app.get('/screams', getAllScreams );
app.post('/scream', FBAuth, postScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', FBAuth, commentScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.get('/scream/:screamId/like', FBAuth, likeScream);
app.get('/scream/:screamId/unlike', FBAuth, unlikeScream);
// USER ROUTES
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image',FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getUser);

exports.api = functions.region('us-east4').https.onRequest(app);
