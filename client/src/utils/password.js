// Mirrors server/utils/password.js — keep both in sync.
export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isValidPassword(password) {
  return typeof password === 'string' && PASSWORD_REGEX.test(password);
}
