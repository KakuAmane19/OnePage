const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('old_index', {
        title: 'OnePage_BETA',
    }); 
});
module.exports = router;