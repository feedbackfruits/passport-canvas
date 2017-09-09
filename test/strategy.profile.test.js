/* global describe, it, expect, before */
/* jshint expr: true */

var CanvasStrategy = require('../lib/strategy');


describe('Strategy#userProfile', function() {

  var strategy =  new CanvasStrategy({
      host: 'https://api.canvas.im',
      clientID: 'ABC123',
      clientSecret: 'secret'
    },
    function() {});

  // mock
  strategy._oauth2.get = function(url, accessToken, callback) {
      var testcases = {
        'https://api.canvas.im/api/v1/users/self/profile': '{ "login_id": "octocat", "id": 1, "name": "monalisa octocat" }'
      };

      var body = testcases[url] || null;
      if (!body) {
        return callback(new Error('wrong url argument'));
      }

      if (accessToken != 'token') { return callback(new Error('wrong token argument')); }

    callback(null, body, undefined);
  };

  describe('loading profile', function() {
    var profile;

    before(function(done) {
      strategy.userProfile('token', function(err, p) {
        if (err) { return done(err); }
        profile = p;
        done();
      });
    });

    it('should parse profile', function() {
      expect(profile.provider).to.equal('canvas');

      expect(profile.id).to.equal('1');
      expect(profile.username).to.equal('octocat');
      expect(profile.displayName).to.equal('monalisa octocat');
    });

    it('should set raw property', function() {
      expect(profile._raw).to.be.a('string');
    });

    it('should set json property', function() {
      expect(profile._json).to.be.an('object');
    });
  });

  describe('encountering an error', function() {
    var err, profile;

    before(function(done) {
      strategy.userProfile('wrong-token', function(e, p) {
        err = e;
        profile = p;
        done();
      });
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('InternalOAuthError');
      expect(err.message).to.equal('Failed to fetch user profile');
    });

    it('should not load profile', function() {
      expect(profile).to.be.undefined;
    });
  });

});
