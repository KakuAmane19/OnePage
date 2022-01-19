const express = require('express');
const router = express.Router();

router.post('/', (req, res, next) => {
    console.error(req.body);
    res.sendStatus(200);
});

module.exports = router;