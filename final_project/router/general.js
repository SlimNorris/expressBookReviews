const express = require('express');
const jwt = require('jsonwebtoken');
const books = require("./booksdb.js");
const isValid = require("./auth_users.js").isValid;
const users = require("./auth_users.js").users;
const session = require('express-session');
const public_users = express.Router();

const axios = require('axios');

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  try {
    const response = await axios.get('https://islasmachinb-5000.theiadocker-2-labs-prod-theiak8s-4-tor01.proxy.cognitiveclass.ai/');
    const bookList = response.data;
    return res.status(200).json(bookList);
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve book list." });
  }
});

public_users.get('/isbn/:isbn', async function (req, res) {
    const isbn = req.params.isbn;
    
    try {
      const response = await axios.get(`https://islasmachinb-5000.theiadocker-2-labs-prod-theiak8s-4-tor01.proxy.cognitiveclass.ai/isbn/${isbn}`);
      const book = response.data;
      
      if (book) {
        return res.status(200).json(book);
      } else {
        return res.status(404).json({ message: "Book not found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve book details." });
    }
  });

  public_users.get('/author/:author', async function (req, res) {
    const author = req.params.author;
    
    try {
      const response = await axios.get(`https://islasmachinb-5000.theiadocker-2-labs-prod-theiak8s-4-tor01.proxy.cognitiveclass.ai/author/${author}`);
      const books = response.data;
      
      if (books.length > 0) {
        return res.status(200).json(books);
      } else {
        return res.status(404).json({ message: "Books not found for the author" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve book details." });
    }
  });

  public_users.get('/title/:title', async function (req, res) {
    const title = req.params.title;
    
    try {
      const response = await axios.get(`https://islasmachinb-5000.theiadocker-2-labs-prod-theiak8s-4-tor01.proxy.cognitiveclass.ai/title/${title}`);
      const books = response.data;
      
      if (books.length > 0) {
        return res.status(200).json(books);
      } else {
        return res.status(404).json({ message: "Books not found for the title" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to retrieve book details." });
    }
  });

// Register a new user
public_users.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!doesExist(username)) {
      users.push({ "username": username, "password": password });
      return res.status(200).json({ message: "User successfully registered. Now you can login." });
    } else {
      return res.status(409).json({ message: "User already exists!" });
    }
  }
  return res.status(400).json({ message: "Unable to register user. Please provide username and password." });
});

public_users.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid login. Please provide username and password." });
    }
  
    if (authenticatedUser(username, password)) {
      const accessToken = jwt.sign({ username: username }, 'secret_key', { expiresIn: '1h' });
      req.session.authorization = { username, accessToken };
      req.session.save(); // Save the session
      return res.status(200).json({ message: "User successfully logged in" });
    } else {
      return res.status(401).json({ message: "Invalid login. Check username and password." });
    }
  });

// Helper function to check if user exists
function doesExist(username) {
  return users.some((user) => user.username === username);
}

// Helper function to authenticate user
function authenticatedUser(username, password) {
  const user = users.find((user) => user.username === username);
  return user && user.password === password;
}

// Middleware for authentication
public_users.use(function auth(req, res, next) {
  if (req.session.authorization) {
    const username = req.session.authorization.username;
    const token = req.session.authorization.accessToken;
    jwt.verify(token, 'secret_key', (err, user) => {
      if (!err) {
        req.user = user;
        next();
      } else {
        return res.status(403).json({ message: "User not authenticated" });
      }
    });
  } else {
    return res.status(403).json({ message: "User not logged in" });
  }
});

public_users.post('/reviews/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!isbn || !review || !username) {
    return res.status(400).json({ message: 'Invalid request. ISBN, review, and username are required.' });
  }

  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: 'Book not found.' });
  }

  // Check if the user has already posted a review for the same ISBN
  if (book.reviews && book.reviews[username]) {
    // Modify the existing review
    book.reviews[username] = review;
    return res.status(200).json({ message: 'Review modified successfully.' });
  }

  // Add a new review
  if (!book.reviews) {
    book.reviews = {};
  }
  book.reviews[username] = review;
  return res.status(200).json({ message: 'Review added successfully.' });
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
  const bookList = JSON.stringify(books, null, 4);
  return res.status(200).send(bookList);
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  // Find the book with the given ISBN
  const book = Object.values(books).find((item) => item.isbn === isbn);

  if (book) {
    return res.status(200).json(book);
  } else {
    return res.status(404).json({ message: "Book not found" });
  }
});



// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;

  // Find books with the given author
  const matchingBooks = Object.values(books).filter((book) =>
    book.author.toLowerCase() === author.toLowerCase()
  );

  if (matchingBooks.length > 0) {
    return res.status(200).json(matchingBooks);
  } else {
    return res.status(404).json({ message: "Books not found for the author" });
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;

  // Find books with the given title
  const matchingBooks = Object.values(books).filter((book) =>
    book.title.toLowerCase() === title.toLowerCase()
  );

  if (matchingBooks.length > 0) {
    return res.status(200).json(matchingBooks);
  } else {
    return res.status(404).json({ message: "Books not found for the title" });
  }
});

// Get book reviews based on ISBN
public_users.get('/reviews/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  if (books[isbn] && books[isbn].reviews) {
    const reviews = books[isbn].reviews;
    return res.status(200).json(reviews);
  } else {
    return res.status(404).json({ message: "Book reviews not found" });
  }
});


module.exports.general = public_users;
