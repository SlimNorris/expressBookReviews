const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
//write code to check is the username is valid
}

const authenticatedUser = (username,password)=>{ //returns boolean
//write code to check if username and password match the one we have in records.
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  //Write your code here
  return res.status(300).json({message: "Yet to be implemented"});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  return res.status(300).json({message: "Yet to be implemented"});
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;
  
    if (!isbn || !username) {
      return res.status(400).json({ message: "Invalid request. ISBN and username are required." });
    }
  
    const book = books[isbn];
  
    if (!book || !book.reviews || !book.reviews[username]) {
      return res.status(404).json({ message: "Review not found." });
    }
  
    delete book.reviews[username];
    return res.status(200).json({ message: "Review deleted successfully." });
  });

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;

