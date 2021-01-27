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