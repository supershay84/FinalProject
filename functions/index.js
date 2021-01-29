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
        getUser,
        getUserDetails,
        readNotifications
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
app.get('/user/:handle', getUserDetails);
app.post('/notifications', readNotifications)

exports.api = functions.region('us-east4').https.onRequest(app);

// CREATE NOTIFICATION WHEN LIKED
exports.createNotificationOnLike = functions
  .region('us-east4')
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        // NO NOTIFICATION WHEN OWN SCREAM/COMMENT IS LIKED
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            screamId: doc.id,
            type: 'like',
            createdAt: new Date().toISOString()
          });
        }
      })
      .catch((err) => console.error(err));
  });
  // CREATE NOTIFICATION WHEN UNLIKED
exports.deleteNotificationOnUnLike = functions
  .region('us-east4')
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

  // CREATE NOTIFICATION WHEN COMMENTED
exports.createNotificationOnComment = functions
  .region('us-east4')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then((doc) => {
        // NO NOTIFICATION WHEN OWN COMMENT IS LIKED
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            screamId: doc.id,
            type: 'comment',
            createdAt: new Date().toISOString()
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

// UPDATE IMAGE ON LIKES/COMMENTS WHEN IMAGE IS CHANGED
  exports.onImageChange = functions
  .region('us-east4')
  .firestore.document('/users/{userId}')
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    // ONLY IF IMAGE IS UPDATED
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log('Image changed!');
      const batch = db.batch();
      return db
        .collection('screams')
        .where('userHandle', '==', change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

// DELETE ALL COMMENTS/LIKES WHEN SCREAM IS DELETED
exports.onScreamDelete = functions
  .region('us-east4')
  .firestore.document('/screams/{screamId}')
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('screamId', '==', screamId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection('likes')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('screamId', '==', screamId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
