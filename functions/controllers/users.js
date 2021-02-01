const { db, admin } = require('../utilities/admin');
const config = require('../utilities/config.js');
const firebase = require('firebase');
firebase.initializeApp(config)
const { validateSignUp, validateLogin, reduceUserDetails } = require('../utilities/validation');

exports.signup = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    const {valid, errors} = validateSignUp(newUser);
    if(!valid) return res.status(400).json(errors);

    const image = 'images-1.jpg';

// VALIDATE DATA
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then((doc) => {
            if(doc.exists){
                return res.status(400).json({handle: 'Name already taken'});
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((idToken) => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${image}?alt=media`,
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({token});
        })
        .catch((err) => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use'){
                return res.status(400).json({email: 'Email already in use'})
            } else {
            return res.status(500).json({ general: 'Something went worng. Plase try again' });
        }});
    }
// LOGIN
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };
    
    const {valid, errors} = validateLogin(user);
    if(!valid) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
        return data.user.getIdToken();
    })
    .then((token) => {
        return res.json({token});
    })
    .catch((err) => {
        console.error(err);
        return res.status(403).json({general: 'Wrong email and/or password. Please try again'});
    });
};
// ADD USER PROFILE
exports.addUserDetails = (req, res) => {
   let userDetails = reduceUserDetails(req.body); 
   db.doc(`/users/${req.user.handle}`).update(userDetails)
    .then(() => {
        return res.json({ message: 'Profile updated!'});
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    });
};
// GET ANOTHER USERS PROFILE
exports.getUserDetails = (req, res) => {
    let userData ={};
    db.doc(`/users/${req.params.handle}`).get()
    .then((doc) => {
        if(doc.exists){
            userData.user = doc.data();
            return db.collection('screams')
                     .where('userHandle', '==', req.params.handle)
                     .orderBy('createdAt', 'desc')
                     .get();
        } else {
            return res.status(404).json({ error: 'Sreamer not found!'});
        }
    })
    .then((data) => {
       userData.screams = [];
       data.forEach ((doc) => {
           userData.screams.push({
               body: doc.data().body,
               createdAt: doc.data().createdAt,
               userHandle: doc.data().userHandle,
               userImage: doc.data().userImage,
               likeCount: doc.data().likeCount,
               commentCount: doc.data().commentCount,
               screamId: doc.data().screamId
           })
       });
       return res.json(userData);
    })
    .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
    })
};
// GET OWN PROFILE
exports.getUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`).get()
        .then((doc) => {
            if(doc.exists){
               userData.credentials = doc.data();
               return db.collection('likes').where('userHandle', '==', req.user.handle).get();
            }
        })
        .then((data) => {
            userData.likes = [];
            data.forEach((doc) => {
                userData.likes.push(doc.data());
            });
            return db.collection('notifications').where('recipient', '==', req.user.handle).orderBy('createdAt', 'desc').get();
        })
        .then((data) => {
            userData.notifications = [];
            data.forEach((doc) => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    read: doc.data().read,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    createdAt: doc.data().createdAt,
                    notificationId: doc.id
                });
            });
            return res.json(userData);
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
};
// MARK NOTIFICATIONS WHEN READ
exports.readNotifications = (req, res) => {
    let batch = db.batch();
    req.body.forEach((notificationId) => {
        const notification = db.doc(`/notification/${notificationId}`);
        batch.update(notification, { read: true });
    });
    batch.commit()
        .then(() => {
            return res.json({ message: 'Notification read'});
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

// ADD IMAGE UPLOADS TO USER PROFILE
// https://mikesukmanowsky.com/firebase-file-and-image-uploads/
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');

    const busboy = new BusBoy({ headers: req.headers});

    let imageFileName;
    let imageToBeUploaded = {};
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname);
        console.log(filename);
        console.log(mimetype);
        if(mimetype !== 'image/jpg' && mimetype !== 'image/png'){
            return res.status(400).json ({ error: 'Wrong file type'});
        }
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        const imageFileName = `${Math.round(Math.random()*10000000)}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath)); 
    })
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl })
        })
        .then(() => {
            return res.json({ message: 'Image uploaded successfully'});
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
    });
    busboy.end(req.rawBody);
}
