let express = require('express');
let router = express.Router();
let user = require('../../models/user');
let csrf = require('../../modules/csrf');

let uploader = require('../../modules/upload');
let project = require('../../models/project');

let formidable = require('express-formidable');
let multipartMiddleware = formidable();
/**
 * Upload Project Logo to the Capella and save an URL
 *
 * @param req
 * @param res
 */
let uploadLogo = function (req, res) {
  let file = req.files['file'];

  if (!checkImageValid(file, res)) {
    return;
  }

  uploader.uploadImageToCapella(file.path, function (resp) {
    let logoUrl;

    if (resp.success) {
      logoUrl = resp.url;
    } else {
      let message = 'Error. Please, try again or later';

      res.send({
        status: 500,
        message: message
      });
      return;
    }

    project.setIcon(req.fields.projectId, logoUrl).then(function (resolve) {
      res.send({
        status: 200,
        logoUrl: logoUrl
      });
    });
  });
};

/**
 * Check image valid
 *
 * @param {JSON} file
 * @param res
 * @returns {boolean}
 */
let checkImageValid = function (file, res) {
  let availableExtensions = ['image/png', 'image/jpeg', 'image/jpg'];

  if (!availableExtensions.includes(file.type)) {
    let message = 'This file extension is not supported. Please, use jpg or png instead';

    res.send({
      status: 500,
      message: message
    });
    return false;
  }

  // max bytes image size (15MB)
  let maxSize = 15 * 1024 * 1024;

  if (file.size > maxSize) {
    let message = 'File is too big. Please try another one under 15MB';

    res.send({
      status: 500,
      message: message
    });
    return false;
  }
  return true;
};

/**
 * Garage settings page
 *
 * @param req
 * @param res
 */
let index = function (req, res) {
  let params = {
    user: res.locals.user,
    csrfToken: req.csrfToken(),
    meta: {
      title: 'User settings'
    },
    success: req.query.success,
    message: req.query.message,
    projects: res.locals.userProjects
  };

  res.render('garage/settings', params);
};

/**
 * Settings update handler
 *
 * @param req
 * @param res
 */
let update = function (req, res) {
  let post = req.body;

  try {
    let params = {
      email: post.email,
    };

    if (post.password) {
      if (post.password !== post.repeatedPassword) {
        throw Error('Passwords don\'t match');
      }
      params.password = post.password;
    }

    if (!params.email) {
      throw Error('Email should be passed');
    }

    user.update(res.locals.user, params)
      .then(function () {
        let message = 'Saved 😉';

        res.redirect('/garage/settings?success=1&message=' + message);
      });
  } catch (e) {
    res.redirect('/garage/settings?success=0&message=' + e.message);
  }
};

router.get('/settings', csrf.csurf, index);
router.post('/settings/save', csrf.csurf, update);
router.post('/settings/loadIcon', multipartMiddleware, csrf.csurfAjax, uploadLogo);

module.exports = router;
