const BLOOD_GROUPS = new Set([
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
]);

const isValidEmail = (email) =>
  typeof email === "string" &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isValidBloodGroup = (group) =>
  typeof group === "string" && BLOOD_GROUPS.has(group.trim().toUpperCase());

const normalizeBloodGroup = (group) =>
  typeof group === "string" ? group.trim().toUpperCase() : group;

const hasValue = (value) => typeof value === "string" && value.trim().length > 0;

const AMP = String.fromCharCode(38); // &
const LT = String.fromCharCode(60); // <
const GT = String.fromCharCode(62); // >
const QUOT = String.fromCharCode(34); // "

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, AMP + "amp;")
    .replace(/</g, AMP + "lt;")
    .replace(/>/g, AMP + "gt;")
    .replace(/"/g, AMP + "quot;")
    .replace(/'/g, AMP + "#39;");

module.exports = {
  BLOOD_GROUPS,
  isValidEmail,
  isValidBloodGroup,
  normalizeBloodGroup,
  hasValue,
  escapeHtml,
};