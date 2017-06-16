'use strict';

let express = require('express');
let router = express.Router();
let auth = require('../../../modules/auth');
let user = require('../../../models/user');

let login = {

  /* Show log in form */
  get: function (req, res, next) {
    user.current(req).then(function (found) {
      if (found) {
        res.redirect('/garage');
        return;
      }

      res.render('yard/auth/login');
    });
  },

  /* Log in function */
  post: function (req, res, next) {

    user.current(req).then(function (found) {

      if (found) {
        res.redirect('/garage');
        return;
      }

    let email = req.body.email,
        password = req.body.password;

      let newUser = {
        'email': email,
        'password': auth.generateHash(password)
      };

      user.getByParams(newUser)
        .then(function(result){
          if (result) {
            auth.authUser(res, result);
            res.redirect('/garage');
          } else {
            res.render('error', { message: 'Try again later.' });
          }
      }).catch(console.log);

    });

  }

};

router.get('/', login.get);
router.post('/', login.post);

module.exports = router;