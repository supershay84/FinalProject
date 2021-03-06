const { db } = require('../utilities/admin');
// GET ALL THE SCREAMS
exports.getAllScreams = (req, res) => {
    db.collection('screams').orderBy('createdAt', 'desc').get()
        .then((data) => {
            let screams = [];
            data.forEach((doc) => {
                screams.push({
                    screamId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(screams);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({error: err.code});
    });
};

// POST A SCREAM
exports.postScream = (req, res) => {
    if(req.body.body.trim() === ''){
        return res.status(400).json({body: 'Must not be empty'});
    }
   const newScream = {
       body: req.body.body,
       userHandle: req.user.handle,
       userImage: req.user.imageUrl,
       createdAt: new Date().toISOString(),
       likeCount: 0,
       commentCount: 0
   };
   db.collection('screams').add(newScream)
        .then((doc) => {
            const resScream = newScream;
            resScream.screamId = doc.id;
            res.json(resScream)
        })
        .catch((err) => {
                console.error(err);
                res.status(500).json({error: 'Something went wrong'});
    });
};

// GET A SCREAM
exports.getScream = (req, res) => {
    let screamData = {};
    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if(!doc.exists){
                return res.status(404).json({ error: 'Scream not heard!'});
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db.collection('comments')
                     .orderBy( 'createdAt', 'desc')
                     .where('screamId', '==', req.params.screamId)
                     .get();
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach((doc) => {
                screamData.comments.push(doc.data());
            });
            return res.json(screamData);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
};

// COMMENT ON A SCREAM
exports.commentScream = (req, res) => {
    if(req.body.body.trim() === '') 
        return res.status(400).json({ comment: 'Must not be empty'});
    
    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if(!doc.exists){
                return res.status(404).json({ comment: 'Scream not heard!'});
            }
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
        })
        .then(() => {
            return db.collection('comments').add(newComment);
        })
        .then(() => {
            res.json(newComment);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: 'Something went wrong' });
        });
};
// LIKE A SCREAM
exports.likeScream = (req, res) => {
    const likeDocument = db.collection('likes')
                           .where('userHandle', '==', req.user.handle)
                           .where('screamId', '==', req.params.screamId)
                           .limit(1);
    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData;
    screamDocument.get()
        .then((doc) => {
            // CHECK IF SCREAM EXISTS
            if(doc.exists){
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Scream not heard!'});
            }
        })
        .then((data) => {
            //CHECK IF USER ALREADY LIKED SCREAM
            if(data.empty){
                return db.collection('likes').add({
                    screamId: req.params.screamId,
                    userHandle: req.user.handle
                })
                .then(() => {
                    //ADD TO LIKE COUNT
                    screamData.likeCount++
                    return screamDocument.update({ likeCount: screamData.likeCount });
                })
                .then(() => {
                    return res.json(screamData);
                })
            } else {
                return res.status(400).json({ error: 'You like this already'})
            }
        })
        .catch((err) => {
            console.error(err)
            res.status(500).json({ error: err.code });
        });
};
// UNLIKE A SCREAM
exports.unlikeScream = (req, res) => {
    const likeDocument = db.collection('likes')
                           .where('userHandle', '==', req.user.handle)
                           .where('screamId', '==', req.params.screamId)
                           .limit(1);
    const screamDocument = db.doc(`/screams/${req.params.screamId}`);

    let screamData;
    screamDocument.get()
        .then((doc) => {
            if(doc.exists){
                screamData = doc.data();
                screamData.screamId = doc.id;
                return likeDocument.get();
            } else {
                return res.status(404).json({ error: 'Scream not heard!'});
            }
        })
        .then((data) => {
            if(data.empty){
                return res.status(400).json({ error: 'You havent liked this'})
            } else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({ likeCount:screamData.likeCount });
                    })
                    .then(() => {
                        res.json(screamData);
                    })
            }
        })
        .catch((err) => {
            console.error(err)
            res.status(500).json({ error: err.code });
        });
};
// DELETE A SCREAM
exports.deleteScream = (req, res) => {
    const document = db.doc(`/screams/${req.params.screamId}`);
    document.get()
        .then((doc) => {
            // CHECK IF SCREAM EXISTS
            if(!doc.exists){
                return res.status(404).json({ error: 'Scream not heard!'});
            }
            // CHECK IF USER IS AUTHORIZED TO DELETE
            if(doc.data().userHandle !== req.user.handle){
                return res.status(403).json({ error: 'Not Authorized' });
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Scream consumed by the void' });
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};