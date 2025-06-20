// @ts-nocheck
import CanvasStrategy from '../src';
import { expect, assert } from 'chai';

describe('Strategy#userProfile', function () {
  var strategy = new CanvasStrategy({
    host: 'https://canvas.instructure.com',
    clientID: 'ABC123',
    clientSecret: 'secret'
  },
    function () { }
  );

  strategy._oauth2.get = function (url, accessToken, callback) {
    var testcases = {
      'https://canvas.instructure.com/api/v1/users/self/profile': '{ "id": "1", "name": "monalisa octocat", "primary_email": "monalisa@github.com" }'
    };

    var body = testcases[url] || null;

    if (!body) {
      return callback(new Error('wrong url argument'));
    }

    if (accessToken != 'token') { return callback(new Error('wrong token argument')); }

    callback(null, body, undefined);
  };

  describe('successful profile retrieval', function () {
    describe('loading profile', function () {
      let profile;

      before(function (done) {
        strategy.userProfile('token', function (err, p) {
          if (err) { return done(err); }
          profile = p;
          done();
        });
      });

      it('should parse profile', function () {
        expect(profile.provider).to.equal('canvas');
        expect(profile.id).to.equal('1');
        expect(profile.displayName).to.equal('monalisa octocat');
      });

      it('should include email in profile', function () {
        expect(profile.emails).to.deep.equal([{ value: 'monalisa@github.com' }]);
      });

      it('should set raw property', function () {
        expect(profile._raw).to.be.a('string');
      });

      it('should set json property', function () {
        expect(profile._json).to.be.an('object');
      });
    });
  });

  describe('profile with custom userProfileURL', function () {
    var customStrategy = new CanvasStrategy({
      host: 'https://canvas.instructure.com',
      clientID: 'ABC123',
      clientSecret: 'secret',
      userProfileURL: 'https://custom.canvas.com/api/v1/users/me'
    },
      function () { }
    );

    it('should use custom userProfileURL', function (done) {
      customStrategy._oauth2.get = function (url, accessToken, callback) {
        expect(url).to.equal('https://custom.canvas.com/api/v1/users/me');
        callback(null, '{ "id": "2", "name": "custom user" }', undefined);
      };

      customStrategy.userProfile('token', function (err, profile) {
        if (err) { return done(err); }
        expect(profile.id).to.equal('2');
        expect(profile.displayName).to.equal('custom user');
        done();
      });
    });
  });

  describe('error handling', function () {
    beforeEach(function () {
      strategy._oauth2.get = function (url, accessToken, callback) {
        if (accessToken === 'network-error') {
          return callback(new Error('Network connection failed'));
        }
        if (accessToken === 'invalid-json') {
          return callback(null, 'invalid json response', undefined);
        }
        if (accessToken === 'wrong-token') {
          return callback(new Error('wrong token argument'));
        }

        callback(null, '{ "id": "1", "name": "test user" }', undefined);
      };
    });

    describe('encountering a network error', function () {
      var err, profile;

      before(function (done) {
        strategy.userProfile('network-error', function (e, p) {
          err = e;
          profile = p;
          done();
        });
      });

      it('should error', function () {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('InternalOAuthError');
        expect(err.message).to.equal('Failed to fetch user profile');
      });

      it('should not load profile', function () {
        expect(profile).to.be.undefined;
      });
    });

    describe('encountering invalid JSON', function () {
      var err, profile;

      before(function (done) {
        strategy.userProfile('invalid-json', function (e, p) {
          err = e;
          profile = p;
          done();
        });
      });

      it('should error', function () {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Failed to parse user profile');
      });

      it('should not load profile', function () {
        expect(profile).to.be.undefined;
      });
    });

    describe('encountering authentication error', function () {
      var err, profile;

      before(function (done) {
        strategy.userProfile('wrong-token', function (e, p) {
          err = e;
          profile = p;
          done();
        });
      });

      it('should error', function () {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('InternalOAuthError');
        expect(err.message).to.equal('Failed to fetch user profile');
      });

      it('should not load profile', function () {
        expect(profile).to.be.undefined;
      });
    });
  });

  describe('profile data variations', function () {
    describe('profile without email', function () {
      it('should handle profile without email field', function (done) {
        strategy._oauth2.get = function (url, accessToken, callback) {
          callback(null, '{ "id": "3", "name": "no email" }', undefined);
        };

        strategy.userProfile('token', function (err, profile) {
          if (err) { return done(err); }
          expect(profile.id).to.equal('3');
          expect(profile.displayName).to.equal('no email');
          expect(profile.emails).to.be.undefined;
          done();
        });
      });
    });

    describe('profile with empty email', function () {
      it('should handle profile with empty email', function (done) {
        strategy._oauth2.get = function (url, accessToken, callback) {
          callback(null, '{ "id": "4", "name": "empty email", "primary_email": "" }', undefined);
        };

        strategy.userProfile('token', function (err, profile) {
          if (err) { return done(err); }
          expect(profile.id).to.equal('4');
          expect(profile.displayName).to.equal('empty email');
          expect(profile.emails).to.be.undefined;
          done();
        });
      });
    });

    describe('array response', function () {
      it('should handle array response from API', function (done) {
        strategy._oauth2.get = function (url, accessToken, callback) {
          callback(null, '[{ "id": "5", "name": "array response", "primary_email": "array@test.com" }]', undefined);
        };

        strategy.userProfile('token', function (err, profile) {
          if (err) { return done(err); }
          expect(profile.id).to.equal('5');
          expect(profile.displayName).to.equal('array response');
          expect(profile.emails).to.deep.equal([{ value: 'array@test.com' }]);
          done();
        });
      });
    });
  });
});
