// Configuration and variables
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const cookieSession = require("cookie-session");
const bcryptjs = require("bcryptjs");
app.use(cookieSession({name: "session", secret: "the-walrus-walked-down-the-street"}));
app.use(bodyParser.urlencoded({ extended: true }));
const { getUserByEmail, generateRandomString } = require("./helpers");


// Setting default engine as EJS
app.set("view engine", "ejs");

// Temporary Database until we create an actual one
const users = {};
const urlDatabase = {};

// Function to build accumulate an owners URLs
const userURLs = (id) => {
  let urls = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      urls[url] = urlDatabase[url];
    }
  }
  return urls;
};

// Routing configuration
app.get("/", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("homepage", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

////////
////////
// Displays user's URL's
app.get("/urls", (req, res) => {
  const myURLs = userURLs(req.session.user_id);
  let templateVars = {
    urls: myURLs,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${shortURL}`);
});

////////
////////
// Create new URL
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

////////
////////
// Update or delete an existing URL
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_id]
  };
  if (req.session.user_id === urlDatabase[templateVars.shortURL].userID) {
    res.render("urls_show", templateVars);
  } else {
    res.statusCode = 404;
    res.render("error_not_logged", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.updatedURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userID) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});


////////
////////
// Redirects user to existing long URL
app.get("/u/:shortURL", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  const shortURL = req.params.shortURL
  const urlObject = urlDatabase[shortURL];
  if (urlObject) {
    const longURL = urlObject.longURL
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.render("error_url", templateVars);
  }
});

////////
////////
// Logs in a user, or logs them out
app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    if (bcryptjs.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.userID;
      res.redirect("/urls");
    } else {
      let templateVars = { user: users[req.session.user_id] };
      res.statusCode = 403;
      res.render("error_login", templateVars);
    }
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.statusCode = 403;
    res.render("error_login", templateVars);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig");
  res.redirect("/urls");
});

////////
////////
// Registers a new user
app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString(6);
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcryptjs.hashSync(req.body.password, 10)
      };
      req.session.user_id = userID;
      res.redirect("/urls");
    } else {
      let templateVars = { user: users[req.session.user_id] };
      res.statusCode = 400;
      res.render("error_duplicate_register", templateVars);
    }
  } else {
    let templateVars = { user: users[req.session.user_id] };
    res.statusCode = 400;
    res.render("error_invalid_register", templateVars);
  }
});

// Making sure server is up on expected port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});