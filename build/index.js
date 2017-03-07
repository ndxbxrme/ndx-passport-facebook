(function() {
  'use strict';
  module.exports = function(ndx) {
    var FacebookStrategy, ObjectID, objtrans, scopes;
    FacebookStrategy = require('passport-facebook').Strategy;
    ObjectID = require('bson-objectid');
    objtrans = require('objtrans');
    ndx.settings.FACEBOOK_KEY = process.env.FACEBOOK_KEY || ndx.settings.FACEBOOK_KEY;
    ndx.settings.FACEBOOK_SECRET = process.env.FACEBOOK_SECRET || ndx.settings.FACEBOOK_SECRET;
    ndx.settings.FACEBOOK_CALLBACK = process.env.FACEBOOK_CALLBACK || ndx.settings.FACEBOOK_CALLBACK;
    ndx.settings.FACEBOOK_SCOPE = process.env.FACEBOOK_SCOPE || ndx.settings.FACEBOOK_SCOPE || 'email';
    if (ndx.settings.FACEBOOK_KEY) {
      if (!ndx.transforms.facebook) {
        ndx.transforms.facebook = {
          email: 'profile.emails[0].value',
          facebook: {
            id: 'profile.id',
            token: 'token',
            name: function(input) {
              if (input) {
                return input.profile.name.givenName + ' ' + input.profile.name.familyName;
              }
            },
            email: 'profile.emails[0].value'
          }
        };
      }
      scopes = ndx.passport.splitScopes(ndx.settings.FACEBOOK_SCOPE);
      ndx.passport.use(new FacebookStrategy({
        clientID: ndx.settings.FACEBOOK_KEY,
        clientSecret: ndx.settings.FACEBOOK_SECRET,
        callbackURL: ndx.settings.FACEBOOK_CALLBACK,
        passReqToCallback: true
      }, function(req, token, refreshToken, profile, done) {
        var updateUser;
        if (!req.user) {
          return ndx.database.select(ndx.settings.USER_TABLE, {
            where: {
              facebook: {
                id: profile.id
              }
            }
          }, function(users) {
            var newUser, updateUser;
            if (users && users.length) {
              if (!users[0].facebook.token) {
                updateUser = objtrans({
                  token: token,
                  profile: profile
                }, ndx.transforms.facebook);
                ndx.database.update(ndx.settings.USER_TABLE, updateUser, {
                  _id: users[0]._id
                });
                return done(null, users[0]);
              }
              return done(null, users[0]);
            } else {
              newUser = objtrans({
                token: token,
                profile: profile
              }, ndx.transforms.facebook);
              newUser._id = ObjectID.generate();
              ndx.database.insert(ndx.settings.USER_TABLE, newUser);
              return done(null, newUser);
            }
          });
        } else {
          updateUser = objtrans({
            token: token,
            profile: profile
          }, ndx.transforms.facebook);
          ndx.database.update(ndx.settings.USER_TABLE, updateUser, {
            _id: req.user._id
          });
          return done(null, req.user);
        }
      }));
      ndx.app.get('/api/facebook', ndx.passport.authenticate('facebook', {
        scope: scopes
      }), ndx.postAuthenticate);
      ndx.app.get('/api/facebook/callback', ndx.passport.authenticate('facebook'), ndx.postAuthenticate);
      ndx.app.get('/api/connect/facebook', ndx.passport.authorize('facebook', {
        scope: scopes
      }));
      return ndx.app.get('/api/unlink/facebook', function(req, res) {
        var user;
        user = req.user;
        user.facebook.token = void 0;
        user.save(function(err) {
          res.redirect('/profile');
        });
      });
    }
  };

}).call(this);

//# sourceMappingURL=index.js.map
