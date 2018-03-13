const fs = require('fs');
const Promise = require('bluebird');
const request = require('request');
const express = require('express');
const router = express.Router();
const middleware = require('../middleware');

module.exports = router;