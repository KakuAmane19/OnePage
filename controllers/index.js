const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('index', {
        title: 'RaiseYourHand'
    });

    res.render('index',
    { link  : { href : '/old_index.html', text : '旧OnePage' } }
    );
});

module.exports = router;