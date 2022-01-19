const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('index', {
        title: 'OnePage2_BETA',
        link  : { href : '/old_index', text : '旧OnePage' },
        recorder : {href : '/recorder', text : 'OnePageRecorder'}
    }); 
});



module.exports = router;