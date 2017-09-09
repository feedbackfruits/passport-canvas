/**
 * Module dependencies.
 */
var util = require('util')
  , OAuth2Strategy = require('passport-oauth2')
  , Profile = require('./profile')
  , InternalOAuthError = require('passport-oauth2').InternalOAuthError;

/**
 * `Strategy` constructor.
 *
 * The Canvas authentication strategy authenticates requests by delegating to
 * Canvas using the OAuth 2.0 protocol.
 *
 * Applications must supply a `verify` callback which accepts an `accessToken`,
 * `refreshToken` and service-specific `profile`, and then calls the `done`
 * callback supplying a `user`, which should be set to `false` if the
 * credentials are not valid.  If an exception occured, `err` should be set.
 *
 * Options:
 *   - `host`          your Canvas application's host
 *   - `clientID`      your Canvas application's Client ID
 *   - `clientSecret`  your Canvas application's Client Secret
 *   - `callbackURL`   URL to which Canvas will redirect the user after granting authorization
 *
 * Examples:
 *
 *     passport.use(new CanvasStrategy({
 #         host: 'http://canvas.example.net/',
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret',
 *         callbackURL: 'https://www.example.net/auth/canvas/callback',
 *       },
 *       function(accessToken, refreshToken, profile, done) {
 *         User.findOrCreate(..., function (err, user) {
 *           done(err, user);
 *         });
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
  options = options || {};

  console.log(`Configuring strategy with options:`, options);

  options.authorizationURL = options.authorizationURL || `${options.host}/login/oauth2/auth`;
  options.tokenURL = options.tokenURL|| `${options.host}/login/oauth2/token`;
  options.scopeSeparator = options.scopeSeparator || ',';
  options.customHeaders = options.customHeaders || {};

  OAuth2Strategy.call(this, options, verify);
  this.name = 'canvas';
  this._userProfileURL = options.userProfileURL || `${options.host}/api/v1/users/self/profile`;
  this._oauth2.useAuthorizationHeaderforGET(true);
}

/**
 * Inherit from `OAuth2Strategy`.
 */
util.inherits(Strategy, OAuth2Strategy);

/**
 * Retrieve user profile from Canvas.
 *
 * This function constructs a normalized profile, with the following properties:
 *
 *   - `provider`         always set to `canvas`
 *   - `id`               the user's Canvas ID
 *   - `username`         the user's Canvas username
 *   - `displayName`      the user's full name
 *   - `profileUrl`       the URL of the profile for the user on Canvas
 *
 * @param {String} accessToken
 * @param {Function} done
 * @api protected
 */
Strategy.prototype.userProfile = function(accessToken, done) {
  var self = this;

  this._oauth2.get(this._userProfileURL, accessToken, function (err, body, res) {
    var json;

    if (err) {
      return done(new InternalOAuthError('Failed to fetch user profile', err));
    }

    try {
      json = JSON.parse(body);
    } catch (ex) {
      return done(new Error('Failed to parse user profile'));
    }

    var profile = Profile.parse(json);
    profile.provider  = 'canvas';
    profile._raw = body;
    profile._json = json;

    done(null, profile);
  });
};

/**
 * Expose `Strategy`.
 */
module.exports = Strategy;
