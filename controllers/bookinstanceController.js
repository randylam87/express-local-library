const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => 
  BookInstance.find({})
              .populate('book')
              .exec((error, list_bookinstances) => {
                if (error) { return next(error); }
                res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
              });

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => 
  BookInstance.findById(req.params.id)
              .populate('book')
              .exec((error, bookinstance) => {
                if (error) { return next(error); }
                if (bookinstance === null) {
                  const error = new Error('Book copy not found');
                  error.status = 404;
                  return next(error);
                }
                res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance })
              })

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) =>
  Book.find({}, 'title')
      .exec((error, books) => {
        if(error) { return next(error); }
        res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
      });

// Handle BookInstance create on POST.
exports.bookinstance_create_post = (req, res, next) => [
  // Validate fields.
  body('book', 'Books must be specified').isLength({ min: 1 }).trim(),
  body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
  body('due_back', 'Invalid Date').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  sanitizeBody('book').trim().escape(),
  sanitizeBody('imprint').trim().escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped and trimmed data.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if(!errors.isEmpty()){
      // There are errors. Render form again with sanitized values and error message.
      Book.find({}, 'title')
          .exec((error, books) => {
            if(error) { return next(error); }
            // Successful, so render.
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
          });
          return;
    } else {
      // Data from form is valid.
      bookinstance.save(error => {
        if(error) { return next(error); }
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      });
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res, next) =>
  res.send('NOT IMPLEMENTED: BookInstance delete GET');

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) =>
  res.send('NOT IMPLEMENTED: BookInstance delete POST');

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res, next) =>
  res.send('NOT IMPLEMENTED: BookInstance update GET');

// Handle bookinstance update on POST.
exports.bookinstance_update_post = (req, res, next) =>
  res.send('NOT IMPLEMENTED: BookInstance update POST');