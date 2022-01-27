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
const generateRandomString =(length) => {
  let result = '';
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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aj481W"
  },
  i3BoGr: {
    longURL:"https://www.google.ca",
    userID: "aJ48lW"
  }
};

const findEmail = (email, database) => {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

// Routing configuration // 
app.get("/", (req, res) => {
  res.send("Hello!");
});

//
app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

//
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    let templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

//
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Need to find bug of why if statement is not working
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].longURL) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.statusCode = 404;
    res.send('<h2>404 Not Found<br>This short URL does not exist in the database.</h2>')
  }
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_login", templateVars)
});

//
app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_registration", templateVars);
});

// Deletes URL from database and redirects to /urls //
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Adds random string to create short URL //
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"]
  }
  res.redirect(`/urls/${shortURL}`);
});

// Update URL //
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.updatedURL;
  res.redirect(`/urls/${shortURL}`);
});

// Set up login / logout //
app.post("/login", (req, res) => {
  const user = findEmail(req.body.email, users);
  if (user) {
    if (req.body.password === user.password) {
      res.cookie("user_id", user.userID);
      res.redirect("/urls");
    } else {
      res.statusCode = 403;
      res.send("<h2>403<br>You entered the wrong password</h2>")
    }
  } else {
    res.statusCode = 403;
    res.send("<h2>403<br>This account is not registered</h2>")
  }
});

//
app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.body.userID);
  console.log("DATABASE", urlDatabase)
  res.redirect("/urls")
});

app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!findEmail(req.body.email, users)) {
      const userID = generateRandomString(6);
      users[userID] = {
        userID,
        email: req.body.email,
        password: req.body.password
      }
      res.cookie("user_id", userID);
      res.redirect("/urls");
    } else {
      res.statusCode = 400;
      res.send("<h2>400 Bad Request<br>That Email has already been registered</h2>")
    }
  } else {
    res.statusCode = 400;
    res.send("<h2>400 Bad Request<br>Please enter a valid Email and Password</h2>")
  }
});



// Making sure server is up on expected port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

