const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('index', {
        title: 'OnePage2_BETA',
        recorder : {href : '/recorder', text : 'OnePageRecorder'}
    }); 
});



module.exports = router;