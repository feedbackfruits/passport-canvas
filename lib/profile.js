/**
 * Parse profile.
 *
 * @param {Object|String} json
 * @return {Object}
 * @api private
 */
exports.parse = function(json) {
  if ('string' === typeof json) {
    json = JSON.parse(json);
  }
  if (json instanceof Array) {
    json = json[0];
  }

  var profile = {};

  profile.id = String(json.id);
  profile.displayName = json.name;
  profile.username = json.login_id;

  return profile;
};
