const { Client, MessageMedia, NoAuth } = require("whatsapp-web.js");
const csv = require("csvtojson");
const express = require("express");
const { body, validationResult } = require("express-validator");
const socketIO = require("socket.io");
const qrcode = require("qrcode");
const http = require("http");
const fs = require("fs");
const { phoneNumberFormatter } = require("./helpers/formatter");
const fileUpload = require("express-fileupload");
const vcard = require("vcard-json");
const bodyParser = require("body-parser");
const port = process.env.PORT || 8080;
// const isLoggedIn = require("./helpers/auth");
const app = express();
// Note that this option available for versions 1.0.0 and newer.
// for parsing file from
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());
// for using custom style
app.use(express.static(__dirname + "/public"));

const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

const client = new Client({
  authStrategy: new NoAuth(),
});

client.initialize();

// Socket IO
io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");

  client.on("qr", (qr) => {
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code received, scan please!");
    });
  });

  client.on("ready", (e) => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });
  client.on("authenticated", (e) => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    client.emit("redirect", "/send-message");

    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");

    client.destroy();
    client.initialize();
  });
});
const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on

  if (req.isAuthenticated() && req.user.email == "airmenatif@gmail.com")
    return next();

  // if they aren't redirect them to the home page
  res.redirect("/");
}
app.get("/", (req, res) => {
  // client.destroy();
  // client.initialize();
  res.sendFile("index.html", {
    root: __dirname,
  });
});

// send user for auth when clicked on login icon

app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    res.clearCookie("remember_me", { path: "/" });

    req.logout();
    res.redirect("/"); //Inside a callback… bulletproof!
  });
});

// Send message
app.get("/send-message", (req, res) => {
  res.sendFile("message.html", {
    root: __dirname,
  });
});
//visit bulk msg page
app.get("/send-bulkmsg", (req, res) => {
  res.sendFile("bulkMsg.html", {
    root: __dirname,
  });
});
//visit bulk msg page
app.get("/send-media", (req, res) => {
  res.sendFile("bulkMedia.html", {
    root: __dirname,
  });
});
app.post(
  "/send-message",
  [body("number").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    const formattedNo = `91${req.body.number}@c.us`;

    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(formattedNo);

    if (!isRegisteredNumber) {
      return res.status(422).json({
        status: false,
        message: "The number is not registered",
      });
    }
    client
      .sendMessage(formattedNo, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// bulk message
app.post("/send-bulkmsg", async (req, res) => {
  // Array of No.
  const userEnteredNo = req.body.number;
  console.log(userEnteredNo);
  const message = req.body.message;
  console.log(message);
  // Entering different block on the basis of mimetype
  // 1. Invalid file selected and and Not Entered any No
  if (req.files == null && userEnteredNo[4] == undefined) {
    console.log("not provided any value");
    res.status(400).json({
      status: false,
      response: "Please Select a valid .vcf/.csv Contacts",
    });
  }
  //2. userEntered No
  if (req.files == null && userEnteredNo[4]) {
    console.log("User Entered Mobile No");
    // format userEntered no in desired form
    let formattedNo = [];
    const UserInputNo = JSON.parse(userEnteredNo);
    UserInputNo.forEach((num) => {
      formattedNo.push(`91${num}@c.us`);
    });
    console.log(formattedNo);
    // send message for each no.
    formattedNo.forEach((singleNo, index, array) => {
      const interval = 5000; // 5 sec wait for each send
      setTimeout(function () {
        console.log(index, singleNo, array.length - 1);
        client
          .sendMessage(singleNo, message)
          .then((response) => {
            if (index == array.length - 1) {
              res.status(200).json({
                status: true,
                response: response,
              });
            }
          })
          .catch((err) => {
            res.status(500).json({
              status: false,
              response: err,
            });
          });
      }, index * interval);
    });
  }
  //3. vcf file No
  if (req.files && req.files.file.mimetype == "text/x-vcard") {
    console.log("User Provided vcf contacts");
    vcard.parseVcardFile(req.files.file.tempFilePath, function (err, contacts) {
      if (err) console.log("oops:" + err);
      else {
        // format vcf no in desired form
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
              .then((response) => {
                if (index == array.length - 1) {
                  res.status(200).json({
                    status: true,
                    response: response,
                  });
                }
              })
              .catch((err) => {
                res.status(500).json({
                  status: false,
                  response: err,
                });
              });
          }, index * interval);
        });
      }
    });
  }
  //4. csv file No
  if (req.files && req.files.file.mimetype == "application/vnd.ms-excel") {
    console.log("User Provided csv contacts");
    // retrieving csv contacts
    let contacts = await csv().fromFile(req.files.file.tempFilePath);
    // filter out undefined contact
    contacts = contacts.filter((contact) => contact.Phone != undefined);
    contacts = contacts.map((contact) => `91${contact.Phone}@c.us`);
    contacts.forEach((singleNo, index, array) => {
      const interval = 5000; // 5 sec wait for each send
      setTimeout(function () {
        console.log(index, singleNo, array.length);
        client
          .sendMessage(singleNo, message)
          .then((response) => {
            if (index == array.length - 1) {
              res.status(200).json({
                status: true,
                response: response,
              });
            }
          })
          .catch((err) => {
            res.status(500).json({
              status: false,
              response: err,
            });
          });
      }, index * interval);
    });
  }
});

// Send media AND bulk message

app.post("/send-media", async (req, res) => {
  const file = [];
  if (req.files.file1 != null) {
    const img = {
      img: req.files.file1,
      caption: req.body.caption1,
    };
    file.push(img);
  }
  if (req.files.file2 != null) {
    const img = {
      img: req.files.file2,
      caption: req.body.caption2,
    };
    file.push(img);
  }
  if (req.files.file3 != null) {
    const img = {
      img: req.files.file3,
      caption: req.body.caption3,
    };
    file.push(img);
  }
  if (req.files.file4 != null) {
    const img = {
      img: req.files.file4,
      caption: req.body.caption4,
    };
    file.push(img);
  }

  const userEnteredNo = req.body.number; //array of no.
  const data = file.map((singleFile) => {
    const data = {
      mimetype: singleFile.img.mimetype,
      name: singleFile.img.name,
      data: fs.readFileSync(singleFile.img.tempFilePath).toString("base64"),
      caption: singleFile.caption,
    };
    return data;
  });

  const files = data.map((singleData) => {
    const imgData = {
      caption: singleData.caption,
      media: new MessageMedia(
        singleData.mimetype,
        singleData.data,
        singleData.name
      ),
    };
    return imgData;
  });

  // Entering different block on the basis of mimetype
  // 1. Invalid file selected and and Not Entered any No
  if (req.files.contacts == null && userEnteredNo[4] == undefined) {
    console.log("not provided any value");
    res.status(400).json({
      status: false,
      response: "Please Select a valid .vcf/.csv Contacts",
    });
  }
  //2. userEntered No
  if (req.files.contacts == null && userEnteredNo[4]) {
    console.log("User Entered Mobile No");
    // format userEntered no in desired form
    let formattedNo = [];
    const UserInputNo = JSON.parse(userEnteredNo);
    UserInputNo.forEach((num) => {
      formattedNo.push(`91${num}@c.us`);
    });
    console.log(formattedNo);
    // send message for each no.
    formattedNo.forEach((singleNo, index, array) => {
      // runs files.forEach for each single No
      setTimeout(function () {
        files.forEach((singlefile, filesIndex, filesArray) => {
          const interval = 5000; // 5 sec wait for each send
          setTimeout(function () {
            // forEach no you have to send Each file
            client
              .sendMessage(singleNo, singlefile.media, {
                caption: singlefile.caption,
              })
              .then((response) => {
                if (
                  index == array.length - 1 &&
                  filesIndex == filesArray.length - 1
                ) {
                  res.status(200).json({
                    status: true,
                    response: response,
                  });
                }
              })
              .catch((err) => {
                res.status(500).json({
                  status: false,
                  response: err,
                });
              });
          }, filesIndex * interval);
        });
      }, files.length * index * 5000 + 1);

      // runs files.forEach for each single No end
    });
  }
  //3. vcf file No  (make it contacts.mimetype)
  if (req.files.contacts && req.files.contacts.mimetype == "text/x-vcard") {
    console.log("User Provided vcf contacts");
    vcard.parseVcardFile(
      req.files.contacts.tempFilePath,
      function (err, contacts) {
        if (err) console.log("oops:" + err);
        else {
          // format vcf no in desired form
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
            // runs files.forEach for each single No
            setTimeout(function () {
              files.forEach((singlefile, filesIndex, filesArray) => {
                const interval = 5000; // 5 sec wait for each send
                setTimeout(function () {
                  // forEach no you have to send Each file
                  client
                    .sendMessage(singleNo, singlefile.media, {
                      caption: singlefile.caption,
                    })
                    .then((response) => {
                      if (
                        index == array.length - 1 &&
                        filesIndex == filesArray.length - 1
                      ) {
                        res.status(200).json({
                          status: true,
                          response: response,
                        });
                      }
                    })
                    .catch((err) => {
                      res.status(500).json({
                        status: false,
                        response: err,
                      });
                    });
                }, filesIndex * interval);
              });
            }, files.length * index * 5000 + 1);

            // runs files.forEach for each single No end
          });
        }
      }
    );
  }
  //4. csv file No
  if (
    req.files.contacts &&
    req.files.contacts.mimetype == "application/vnd.ms-excel"
  ) {
    console.log("User Provided csv contacts");
    // retrieving csv contacts
    let contacts = await csv().fromFile(req.files.contacts.tempFilePath);
    // filter out undefined contact
    contacts = contacts.filter((contact) => contact.Phone != undefined);
    contacts = contacts.map((contact) => `91${contact.Phone}@c.us`);
    contacts.forEach((singleNo, index, array) => {
      // runs files.forEach for each single No
      setTimeout(function () {
        files.forEach((singlefile, filesIndex, filesArray) => {
          const interval = 5000; // 5 sec wait for each send
          setTimeout(function () {
            // forEach no you have to send Each file
            client
              .sendMessage(singleNo, singlefile.media, {
                caption: singlefile.caption,
              })
              .then((response) => {
                if (
                  index == array.length - 1 &&
                  filesIndex == filesArray.length - 1
                ) {
                  res.status(200).json({
                    status: true,
                    response: response,
                  });
                }
              })
              .catch((err) => {
                res.status(500).json({
                  status: false,
                  response: err,
                });
              });
          }, filesIndex * interval);
        });
      }, files.length * index * 5000 + 1);

      // runs files.forEach for each single No end
    });
  }
});

const findGroupByName = async function (name) {
  const group = await client.getChats().then((chats) => {
    return chats.find(
      (chat) => chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });
  return group;
};

// Send message to group
// You can use chatID or group name, yea!
app.post(
  "/send-group-message",
  [
    body("id").custom((value, { req }) => {
      if (!value && !req.body.name) {
        throw new Error("Invalid value, you can use `id` or `name`");
      }
      return true;
    }),
    body("message").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    }

    let chatId = req.body.id;
    const groupName = req.body.name;
    const message = req.body.message;

    // Find the group by name
    if (!chatId) {
      const group = await findGroupByName(groupName);
      if (!group) {
        return res.status(422).json({
          status: false,
          message: "No group found with name: " + groupName,
        });
      }
      chatId = group.id._serialized;
    }

    client
      .sendMessage(chatId, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// Clearing message on spesific chat
app.post("/clear-message", [body("number").notEmpty()], async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped(),
    });
  }

  const number = phoneNumberFormatter(req.body.number);

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: "The number is not registered",
    });
  }

  const chat = await client.getChatById(number);

  chat
    .clearMessages()
    .then((status) => {
      res.status(200).json({
        status: true,
        response: status,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

server.listen(port, function () {
  console.log("App running on : " + port);
});
