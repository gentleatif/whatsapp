  exports.vCardController = (vcfpath) => {
    vcard.parseVcardFile(vcfpath, function (err, contacts) {
      if (err) console.log("oops:" + err);
      else {
        // format all no in desired form
        let formattedNo = [];
        const results = contacts.filter(
          (contact) => contact.phone[0] != undefined
        );
        results.forEach((result) => {
          formattedNo.push(`${result.phone[0].value}@c.us`);
        });
        const pureIndianFormat = formattedNo.filter((no) => {
          return no.startsWith("+91") && no.length == 20;
        });
        const finalFormattedVcfNo = [];
        pureIndianFormat.forEach((number, index) => {
          let newNo = number.replace("+", "");
          newNo = newNo.replace(/ +/g, "");
          finalFormattedVcfNo.push(newNo);
        });
        finalFormattedVcfNo.forEach((singleNo, index, array) => {
          const interval = 5000; // 5 sec wait for each send
          setTimeout(function () {
            console.log(index, singleNo, array.length);
            client
              .sendMessage(singleNo, message)
              .then((d) => {
                if (index == array.length) {
                  res.status(200).json({
                    status: true,
                    response: "Messages Sent Successfully To All Contacts",
                  });
                }
              })
              .catch((e) => {
                console.log("rejected");
              });
          }, index * interval);
        });
      }
    });
  };
};
