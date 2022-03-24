const vcard = require("vcard-json");
let results = [];

const vcfNumberFormatter = async function (numbers) {
  vcard.parseVcardFile(numbers, async function (err, contacts) {
    if (err) console.log("oops:" + err);
    else {
      validNo = await contacts.filter(
        (contact) => contact.phone[0] != undefined
      );
    results.push(validNo);
    }
  });
  console.log(results);
  results = results.map((result) => {
    return `${result.phone[0].value}@c.us`;
  });
  results = results.filter((no) => {
    return no.startsWith("+91") && no.length == 20;
  });
  results = results.map(async (number, index) => {
    let newNo = number.replace("+", "");
    return newNo.replace(/ +/g, "");
  });
  return results;
};

module.exports = {
  vcfNumberFormatter,
};
