// Configuration and variables
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const req = require("express/lib/request");
const cookieSession = require("cookie-session");
const bcryptjs = require("bcryptjs")
app.use(cookieSession({name: "session", secret: "the-walrus-walked-down-the-street"}));
app.use(bodyParser.urlencoded({ extended: true }));

// Generates random string for short URLs
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateRandomString = (length) => {
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Setting default engine as EJS
app.set("view engine", "ejs");




// Temporary Database until we create an actual one
const users = {};
const urlDatabase = {};

const findEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

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
  res.send("Hello!");
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
  if (req.session.user_id) {
    let templateVars = { user: users[req.session.user_id] };
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
    res.send("<h2>404<br>You need to log in to access this URL</h2>");
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
// Need to find bug of why if statement is not working
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].longURL) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.statusCode = 404;
    res.send('<h2>404 Not Found<br>This short URL does not exist in the database.</h2>');
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
  const user = findEmail(req.body.email, users);
  if (user) {
    if (bcryptjs.compareSync(req.body.password, user.password)) {
      req.session.user_id = user.userID;
      res.redirect("/urls");
    }
  } else {
    res.statusCode = 403;
    res.send("<h2>403<br>The email or password in incorrect</h2>");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("session");
  res.clearCookie("session.sig")
  console.log("DATABASE", urlDatabase);
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
    if (!findEmail(req.body.email, users)) {
      const userID = generateRandomString(6);
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcryptjs.hashSync(req.body.password, 10)
      };
      req.session.user_id = userID;
      res.redirect("/urls");
    } else {
      res.statusCode = 400;
      res.send("<h2>400 Bad Request<br>That Email has already been registered</h2>");
    }
  } else {
    res.statusCode = 400;
    res.send("<h2>400 Bad Request<br>Please enter a valid Email and Password</h2>");
  }
});

// Making sure server is up on expected port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});