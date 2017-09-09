/* global describe, it, expect */
/* jshint expr: true */

var CanvasStrategy = require('../lib/strategy');


describe('Strategy', function() {

  var strategy = new CanvasStrategy({
      clientID: 'ABC123',
      clientSecret: 'secret'
    },
    function() {});

  it('should be named canvas', function() {
    expect(strategy.name).to.equal('canvas');
  });

});
