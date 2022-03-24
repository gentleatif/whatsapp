const phoneNumberFormatter = function (number) {
  // 1. Eliminate characters other than numbers
  let formatted = number.replace(/\D/g, "");

  // 2.Remove the leading 0 (prefix)
  // Then replaced with 91
  if (formatted.startsWith("0")) {
    formatted = "91" + formatted.substr(1);
  }

  if (!formatted.endsWith("@c.us")) {
    formatted += "@c.us";
  }

  return formatted;
};

module.exports = {
  phoneNumberFormatter,
};
