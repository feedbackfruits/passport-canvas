import OAuth2Strategy, { InternalOAuthError, StrategyOptions, VerifyFunction } from 'passport-oauth2';
import { type oauth2tokenCallback } from 'oauth';

type CanvasStrategyOptions = StrategyOptions & {
  host: string;
  userProfileURL?: string;
}

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
 * @api public
 */
export default class Strategy extends OAuth2Strategy {
  options: CanvasStrategyOptions;
  _userProfileURL: string;

  constructor(options: CanvasStrategyOptions, verify: VerifyFunction) {
    options.authorizationURL = options.authorizationURL || `${options.host}/login/oauth2/auth`;
    options.tokenURL = options.tokenURL|| `${options.host}/login/oauth2/token`;
    options.scopeSeparator = options.scopeSeparator || ' ';
    options.customHeaders = options.customHeaders || {};
    super(options, verify);

    this.options = options;

    this.name = 'canvas';
    this._userProfileURL = options.userProfileURL || `${options.host}/api/v1/users/self/profile`;
    this._oauth2.useAuthorizationHeaderforGET(true);
  }

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
  override userProfile(accessToken: string, done: (error: any, profile?: any) => void) {
    this._oauth2.get(this._userProfileURL, accessToken, (err, body, res) => {
      let json: Record<string, unknown>;

      if (err) {
        return done(new InternalOAuthError('Failed to fetch user profile', err));
      }

      try {
        json = JSON.parse(body as string);
      } catch (ex) {
        return done(new Error('Failed to parse user profile'));
      }

      const profile = this.parse(json);
      profile.provider  = 'canvas';
      profile._raw = body;
      profile._json = json;

      done(null, profile);
    });
  };

  public parse(json: string | Record<string, unknown>) {
    if (typeof json === 'string') {
      json = JSON.parse(json);
    }

    if (json instanceof Array) {
      json = json[0];
    }

    const profile: Record<string, unknown> = {};
    const assertedJson = json as Record<string, unknown>;

    profile.id = assertedJson.id;
    profile.displayName = assertedJson.name;
    profile.username = assertedJson.login_id;

    if (assertedJson.primary_email && (assertedJson.primary_email as string).length) {
      profile.emails = [ { value: assertedJson.primary_email } ];
    }

    return profile;
  };
}
