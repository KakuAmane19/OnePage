const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('recorder', {
        title: 'OnePageRecorder',
    }); 
});
module.exports = router;