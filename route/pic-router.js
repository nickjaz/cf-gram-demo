'use strict';

//native node modules
const fs = require('fs');
const path = require('path');     //gives details/info about particular file path
const del = require('del');       //allows deleting from the file system
const AWS = require('aws-sdk');   //library
const multer = require('multer'); //creates a req.file with information

const Router = require('express').Router;
const createError = require('http-errors');
const debug = require('debug')('cfgram:pic-router');

const Pic = require('../model/pic.js');
const Gallery = require('../model/gallery.js');
const bearerAuth = require('../lib/bearer-auth-middleware.js');

AWS.config.setPromisesDependency(require('bluebird'));

const s3 = new AWS.S3();    //instantiate a new s3 constructor object
const dataDir = `${__dirname}/../data`;
const upload = multer({ dest: dataDir });

const picRouter = module.exports = Router();

function s3uploadProm(params) {
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, s3data) => {
      resolve(s3data);
    });
  });
}

picRouter.post('/api/gallery/:galleryID/pic', bearerAuth, upload.single('image'), function(req, res, next) {
  debug('POST: /api/gallery/:galleryID/pic');

  if (!req.file) {
    return next(createError(400, 'file not found'));
  }

  if (!req.file.path) {
    return next(createError(500, 'file not saved'));
  }

  let ext = path.extname(req.file.originalname);  //grabs the file extension type upon upload

  //passed into the upload call to s3 above ^^
  let params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET,
    Key: `${req.file.filename}${ext}`,        //multer gives it a hashed file name
    Body: fs.createReadStream(req.file.path)
  };

  Gallery.findById(req.params.galleryID)    //go to this collection by id
  .then( () => s3uploadProm(params))        //uploads pic
  .then( s3data => {                        //when response comes back with data
    del[`${dataDir}/*`];                    //deletes file from system
    let picData = {
      name: req.body.name,
      desc: req.body.desc,
      objectKey: s3data.Key,                //make sure key and location are capitalized
      imageURI: s3data.Location,
      userID: req.user._id,
      galleryID: req.params.galleryID
    };
    return new Pic(picData).save();
  })
  .then(pic => res.json(pic))
  .catch(err => next(err));
});
