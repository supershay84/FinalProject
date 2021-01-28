const { db } = require('../utilities/admin');
// GET ALL THE SCREAMS
exports.getAllScreams = (req, res) => {
    db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
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
       createdAt: new Date().toISOString()
   };
   db
   .collection('screams')
   .add(newScream)
   .then((doc) => {
       res.json({message: `Document ${doc.id} created successfully`})
   })
    .catch((err) => {
        res.status(500).json({error: 'Something went wrong'});
        console.error(err);
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
            return res.status(404).json({ error: 'Scream not heard!'});
        }
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