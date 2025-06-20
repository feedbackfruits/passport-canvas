// @ts-nocheck
import CanvasStrategy from '../src';
import fs from 'fs';
import { expect } from 'chai';

describe('Strategy', function() {
  describe('constructor', function() {
    it('should create strategy without host (for backward compatibility)', function() {
      expect(() => {
        new CanvasStrategy({
          clientID: 'ABC123',
          clientSecret: 'secret'
        }, function() {});
      }).to.not.throw();
    });

    it('should set default authorizationURL', function() {
      const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy.options.authorizationURL).to.equal('https://canvas.instructure.com/login/oauth2/auth');
    });

    it('should set default tokenURL', function() {
      const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy.options.tokenURL).to.equal('https://canvas.instructure.com/login/oauth2/token');
    });

    it('should allow custom authorizationURL', function() {
      const customAuthURL = 'https://custom.canvas.com/login/oauth2/auth';
      const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret',
        authorizationURL: customAuthURL
      }, function() {});

      expect(strategy.options.authorizationURL).to.equal(customAuthURL);
    });

    it('should allow custom tokenURL', function() {
      const customTokenURL = 'https://custom.canvas.com/login/oauth2/token';
      const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret',
        tokenURL: customTokenURL
      }, function() {});

      expect(strategy.options.tokenURL).to.equal(customTokenURL);
    });

    it('should set default scopeSeparator to space', function() {
      const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy.options.scopeSeparator).to.equal(' ');
    });

    it('should set default userProfileURL based on host', function() {
      const host = 'https://canvas.instructure.com';
      const strategy = new CanvasStrategy({
        host: host,
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy._userProfileURL).to.equal(`${host}/api/v1/users/self/profile`);
    });

    it('should allow custom userProfileURL', function() {
      const customProfileURL = 'https://custom.canvas.com/api/v1/users/me';
      const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret',
        userProfileURL: customProfileURL
      }, function() {});

      expect(strategy._userProfileURL).to.equal(customProfileURL);
    });

    it('should configure OAuth2 to use authorization header for GET', function() {
      const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      }, function() {});

      expect(strategy._oauth2._useAuthorizationHeaderForGET).to.be.true;
    });
  });

  describe('strategy name', function() {
    const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'canvas'
      },
      function() {}
    );

    it('should be named canvas', function() {
      expect(strategy.name).to.equal('canvas');
    });
  });

  describe('profile.parse', function() {
    const strategy = new CanvasStrategy({
        host: 'https://canvas.instructure.com',
        clientID: 'ABC123',
        clientSecret: 'secret'
      },
      function() {}
    );

    describe('example profile', function() {
      let profile;

      before(function(done) {
        fs.readFile('test/data/example.json', 'utf8', function(err, data) {
          if (err) { return done(err); }
          profile = strategy.parse(data);
          done();
        });
      });

      it('should parse profile', function() {
        expect(profile.id).to.equal(1);
        expect(profile.displayName).to.equal('monalisa octocat');
      });
    });

    describe('profile with email', function() {
      it('should parse profile with email', function() {
        const json = {
          id: '123',
          name: 'John Doe',
          primary_email: 'john.doe@example.com'
        };

        const profile = strategy.parse(json);

        expect(profile.id).to.equal('123');
        expect(profile.displayName).to.equal('John Doe');
        expect(profile.emails).to.deep.equal([{ value: 'john.doe@example.com' }]);
      });
    });

    describe('profile with empty email', function() {
      it('should not include emails if email is empty', function() {
        const json = {
          id: '123',
          name: 'John Doe',
          primary_email: ''
        };

        const profile = strategy.parse(json);

        expect(profile.id).to.equal('123');
        expect(profile.displayName).to.equal('John Doe');
        expect(profile.emails).to.be.undefined;
      });
    });

    describe('profile without email', function() {
      it('should not include emails if email is missing', function() {
        const json = {
          id: '123',
          name: 'John Doe'
        };

        const profile = strategy.parse(json);

        expect(profile.id).to.equal('123');
        expect(profile.displayName).to.equal('John Doe');
        expect(profile.emails).to.be.undefined;
      });
    });

    describe('array response', function() {
      it('should parse first element of array response', function() {
        const jsonArray = [
          {
            id: '456',
            name: 'Jane Smith',
            primary_email: 'jane.smith@example.com'
          },
          {
            id: '789',
            name: 'Bob Johnson'
          }
        ];

        const profile = strategy.parse(jsonArray);

        expect(profile.id).to.equal('456');
        expect(profile.displayName).to.equal('Jane Smith');
        expect(profile.emails).to.deep.equal([{ value: 'jane.smith@example.com' }]);
      });
    });

    describe('string input', function() {
      it('should parse JSON string input', function() {
        const jsonString = JSON.stringify({
          id: '789',
          name: 'Alice Brown'
        });

        const profile = strategy.parse(jsonString);

        expect(profile.id).to.equal('789');
        expect(profile.displayName).to.equal('Alice Brown');
      });
    });
  });
});
