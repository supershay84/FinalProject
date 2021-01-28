const { db } = require('../utilities/admin');

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
}

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
}