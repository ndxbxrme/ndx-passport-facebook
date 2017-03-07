'use strict'

module.exports = (ndx) ->
  FacebookStrategy = require('passport-facebook').Strategy
  ObjectID = require 'bson-objectid'
  objtrans = require 'objtrans'
  ndx.settings.FACEBOOK_KEY = process.env.FACEBOOK_KEY or ndx.settings.FACEBOOK_KEY
  ndx.settings.FACEBOOK_SECRET = process.env.FACEBOOK_SECRET or ndx.settings.FACEBOOK_SECRET
  ndx.settings.FACEBOOK_CALLBACK = process.env.FACEBOOK_CALLBACK or ndx.settings.FACEBOOK_CALLBACK
  ndx.settings.FACEBOOK_SCOPE = process.env.FACEBOOK_SCOPE or ndx.settings.FACEBOOK_SCOPE or 'email'
  if ndx.settings.FACEBOOK_KEY
    if not ndx.transforms.facebook
      ndx.transforms.facebook =
        email: 'profile.emails[0].value'
        facebook:
          id: 'profile.id'
          token: 'token'
          name: (input) ->
            if input
              input.profile.name.givenName + ' ' + input.profile.name.familyName
          email: 'profile.emails[0].value'
    scopes = ndx.passport.splitScopes ndx.settings.FACEBOOK_SCOPE
    ndx.passport.use new FacebookStrategy
      clientID: ndx.settings.FACEBOOK_KEY
      clientSecret: ndx.settings.FACEBOOK_SECRET
      callbackURL: ndx.settings.FACEBOOK_CALLBACK
      passReqToCallback: true
    , (req, token, refreshToken, profile, done) ->
      if not req.user
        ndx.database.select ndx.settings.USER_TABLE,
          where:
            facebook:
              id: profile.id
        , (users) ->
          if users and users.length
            if not users[0].facebook.token
              updateUser = objtrans
                token: token
                profile: profile
              , ndx.transforms.facebook
              ndx.database.update ndx.settings.USER_TABLE, updateUser, _id:users[0]._id
              return done null, users[0]
            return done null, users[0]
          else
            newUser = objtrans
              token: token
              profile: profile
            , ndx.transforms.facebook
            newUser._id = ObjectID.generate()
            ndx.database.insert ndx.settings.USER_TABLE, newUser
            return done null, newUser
      else
        updateUser = objtrans
          token: token
          profile: profile
        , ndx.transforms.facebook
        ndx.database.update ndx.settings.USER_TABLE, updateUser, _id:req.user._id
        return done null, req.user
    ndx.app.get '/api/facebook', ndx.passport.authenticate('facebook', scope: scopes)
    , ndx.postAuthenticate
    ndx.app.get '/api/facebook/callback', ndx.passport.authenticate('facebook')
    , ndx.postAuthenticate
    ndx.app.get '/api/connect/facebook', ndx.passport.authorize('facebook', scope: scopes)
    ndx.app.get '/api/unlink/facebook', (req, res) ->
      user = req.user
      user.facebook.token = undefined
      user.save (err) ->
        res.redirect '/profile'
        return
      return