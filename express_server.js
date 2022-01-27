// Configuration and variables
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Generates random string for short URLs
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = function(length) {
  let result = ' ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

// Setting default engine as EJS
app.set("view engine", "ejs");

const users = {  "userRandomID": {
  id: "userRandomID", 
  email: "user@example.com", 
  password: "purple-monkey-dinosaur"
},
"user2RandomID": {
  id: "user2RandomID", 
  email: "user2@example.com", 
  password: "dishwasher-funk"
}}
// Temporary Database until we create an actual one
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
  "3md43N": "http://www.facebook.com"
};

const findEmail = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

// Routing configuration
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    users: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars)
})

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id" ]]};
  res.render("urls_registration", templateVars);
});

// Deletes URL from database and redirects to /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Adds random string to create short URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// Update URL
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.updatedURL;
  res.redirect(`/urls/${shortURL}`);
});

// Set up login / logout
app.post("/login", (req, res) => {
  if (findEmail(req.body.email)) {
    res.cookie("user_id", users.userID);
    res.redirect("urls")
  } else {
    res.redirect("/login");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.userID);
  res.redirect("/urls")
  console.log(users)
});

app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {

    if (!findEmail(req.body.email)) {
      const userID = generateRandomString(4);
      users[userID] = {
        userID,
        email: req.body.email,
        password: req.body.password
      }
      res.cookie("user_id", userID);
      res.redirect("/urls");
    } else {
      res.statusCode = 400;
      res.send("<h2>400 Bad Request<br>That email has already been registered</h2>")
    }
  } else {
    res.statusCode = 400;
    res.send("<h2>400 Bad Request<br>Please enter a valid username and password</h2>")
  }
});



// Making sure server is up on expected port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

