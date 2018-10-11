const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = (req, res, next) =>
  Genre.find({})
       .sort([['name']])
       .exec((error, list_genres) => {
         if (error) { return next(error) }
         res.render('genre_list', { title: 'Genre List', genre_list: list_genres });
       });

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
  async.parallel({
    genre: callback => Genre.findById(req.params.id)
                            .exec(callback),
    genre_books: callback => Book.find({'genre': req.params.id})
                                 .sort([['title']])
                                 .exec(callback)
  }, (error, results) => {
    if (error) { return next(error); }
    if (results.genre === null) {
      const error = new Error('Genre not found');
      error.status = 404;
      return next(error);
    }
    res.render('genre_detail', { title: 'Genre Details', genre: results.genre, genre_books: results.genre_books });
  })
}

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => 
  res.render('genre_form', { title: 'Create Genre' });

// Handle Genre create on POST.
exports.genre_create_post = [

  // Validate that the name field is not empty
  body('name', 'Genre name required').isLength({ min: 1 }).trim(),

  // Sanatize (trim and escape) the name field
  sanitizeBody('name').trim().escape(),

  // Process requests after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({
      name: req.body.name
    });

    if (!errors.isEmpty()) {
      return res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec((error, found_genre) => {
          if (error) { return next(error) }

          if (found_genre) {
            // If same genre exists, redirect to that genre's url.
            res.redirect(found_genre.url);
          } else {
            genre.save(error => {
              if (error) { return next(error); }
              // Genere saved. Redirect to genre detail page.
              res.redirect(genre.url);
            });
          }
        });
    }
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) =>
  // Todo: Implement genre delete
  res.send('NOT IMPLEMENTED: Genre delete GET');

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) =>
  // Todo: Implement genre delete
  res.send('NOT IMPLEMENTED: Genre delete POST');

// Display Genre update form on GET.
exports.genre_update_get = (req, res, next) =>
  // Todo: Implement genre update
  res.send('NOT IMPLEMENTED: Genre update GET');

// Handle Genre update on POST.
exports.genre_update_post = (req, res, next) =>
  // Todo: Implement genre update
  res.send('NOT IMPLEMENTED: Genre update POST');