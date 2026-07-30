// Single source of truth for password strength requirements — apply this
// same check anywhere a password is set (user create, password change, etc).
const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function isValidPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}

module.exports = { isValidPassword, PASSWORD_RULE_MESSAGE };
