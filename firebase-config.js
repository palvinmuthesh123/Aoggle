var admin = require("firebase-admin");

var serviceAccount = require("./cred.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aogglehomes-bcc0e-default-rtdb.firebaseio.com"
});

module.exports.admin = admin