const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const async = require('async');
exports.index = (req, res, next) => {
  async.parallel({
    book_count: callback => Book.countDocuments({}, callback), // Pass an empty object as match condition to find all documents of this collection
    book_instance_count: callback => BookInstance.countDocuments({}, callback),
    book_instance_available_count: callback => BookInstance.countDocuments('Available', callback),
    author_count: callback => Author.countDocuments({}, callback),
    genre_count: callback => Genre.countDocuments({}, callback)
  }, 
  (error, results) => res.render('index', { title: `Randy and Faiz's Local Library Home`, error: error, data: results }));
}


// Display list of all books.
exports.book_list = (req, res, next) => 
  Book.find({}, 'title author',)
      .populate('author')
      .exec((error, list_books) => {
        if (error) { return next(error); }
        res.render('book_list', { title: 'Book List', book_list: list_books });
      })

// Display detail page for a specific book.
exports.book_detail = (req, res, next) => {
  async.parallel({
    book: callback => Book.findById(req.params.id)
                          .populate('author')
                          .populate('genre')
                          .exec(callback),
    book_instance: callback => BookInstance.find({ 'book': req.params.id })
                                           .exec(callback)
  }, (error, results) => {
    if (error) { return next(error); }
    if (results.book === null) { 
      const error = new Error('Book not found');
      error.status = 404;
      return next(error);
    }
    res.render('book_detail', { title: 'Title', book: results.book, book_instances: results.book_instance })
  })
}

// Display book create form on GET.
exports.book_create_get = (req, res, next) =>
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel({
    authors: callback => Author.find(callback),
    genres: callback => Genre.find(callback)
  }, (error, results) => {
    if(error) { return next(error); }
    res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
  });

// Handle book create on POST.
exports.book_create_post = (req, res, next) => [
  // Convert the genre to an array.
  (req, res, next) => {
    if(!(req.body.genre instanceof Array)) {
      if(typeof req.body.genre === undefined) {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },
  // Validate fields.
  body('title', 'Title must not be empty.').isLength({ min: 1 }).trim(),
  body('author', 'Author must not be empty').isLength({ min: 1 }).trim(),
  body('summary', 'Summary must not be empty').isLength({ min: 1 }).trim(),
  body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

  // Sanitize fields (using wildcard).
  sanitizeBody('*').trim().escape(),

  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a book object with escaped and trimmed data,
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre
    });

    if(!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel({
        authors: callback => Author.find(callback),
        genres: callback => Genre.find(callback)
      }, (error, results) => {
        if(error) { return next(error); }

        // Mark our selected genres as checked.
        results.genres = results.genres.map(genre => {
          if(book.genre.indexOf(genre._id) > -1) {
            return genre.checked = true;
          }
        });
        res.render('book_form', { title: 'Create Book', authors: results.author, genres: results.genre, book: book, errors: errors.array() });
      });
      return
    } else {
      // Data from form is valid. Save book.
      book.save(error => {
        if(error) { return next(error); }
        // Successful - redirect to new book record.
        res.redirect(book.url);
      });
    }
  }
];

// Display book delete form on GET.
exports.book_delete_get = (req, res, next) =>
  res.send('NOT IMPLEMENTED: Book delete GET');

// Handle book delete on POST.
exports.book_delete_post = (req, res, next) =>
  res.send('NOT IMPLEMENTED: Book delete POST');

// Display book update form on GET.
exports.book_update_get = (req, res, next) =>
  // Get book, authors and genre for form.
  async.parallel({
    book: callback => Book.findById(req.params.id)
                          .populate('author')
                          .populate('genre')
                          .exec(callback),
    authors: callback => Author.find(callback),
    genres: callback => Genre.find(callback)
  }, (error, results) => {
    if(error) { return next(error); }
    if(results.book === null) { // No results
      const error = new Error('Book not found');
      error.status = 404;
      return next(error);
    }
    // Success.
    // Mark our selected genres as checked.
    for (let all_g_iter = 0; all_g_iter < results.genres.length; all_g_iter++) {
      for (let book_g_iter = 0; book_g_iter < results.book.genre.length; book_g_iter++) {
        if (results.genres[all_g_iter]._id.toString() == results.book.genre[book_g_iter]._id.toString()) {
          results.genres[all_g_iter].checked = true;
        }
      }
    }
    res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
  })

// Handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if(!(req.body.genre instanceof Array)) {
      if(typeof req.body.genre === undefined){
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },
  // Validate fields.
  body('title', 'Title must not be empty').isLength({ min: 1 }).trim(),
  body('author', 'Author must not be empty').isLength({ min: 1 }).trim(),
  body('summary', 'Summary must not be empty').isLength({ min: 1 }).trim(),
  body('isbn', 'ISBN must not be empty').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  sanitizeBody('title').trim().escape(),
  sanitizeBody('author').trim().escape(),
  sanitizeBody('summary').trim().escape(),
  sanitizeBody('isbn').trim().escape(),
  sanitizeBody('genre.*').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a book object with escaped/trimmed data and old id.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: (typeof req.body.genre === undefined) ? [] : req.body.genre,
      _id: req.params.id // This is required or a new ID will be assigned!
    });

    if(!errors.isEmpty()) {
      // There are errors. Render form again withs anitized values/error messages.

      // Get all authors and genres for form.
      async.parallel({
        author: callback => Authors.find(callback),
        genres: callback => Genre.find(callback)
      }, (error, results) => {
        if(error) { return next(error); }
        
        // Mark our selected genres as checked.
        results.genres = results.genres.map(genre => {
          if(book.genre.indexOf(genre._id) > -1) {
            genre.checked = true;
          }
        });
      });
      return;
    } else {
      // Data from form is valid. Update the record.
      Book.findByIdAndUpdate(req.params.id, book, {}, (error, thebook) => {
        if(error) { return next(error); }
        // Successful - redirect to the book detail page.
        res.redirect(thebook.url);
      });
    }
  }
];