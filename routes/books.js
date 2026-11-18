const express = require('express');
const { Op, where, cast, col } = require('sequelize');
const { Book } = require('../models');

const router = express.Router();
const BOOKS_PER_PAGE = 5;

// Wrap async handlers so rejected promises reach the global error handler
const asyncHandler = (cb) => async (req, res, next) => {
  try {
    await cb(req, res, next);
  } catch (error) {
    next(error);
  }
};

// Pull the editable fields from the form, turning blank optional values into null
const getBookData = (body) => ({
  title: body.title,
  author: body.author,
  genre: body.genre ? body.genre : null,
  year: body.year !== undefined && body.year.trim() !== '' ? body.year.trim() : null
});

// Build a "not found" error for ids that don't match a book
const notFound = () => {
  const error = new Error("Sorry! We couldn't find the book you were looking for.");
  error.status = 404;
  return error;
};

// GET /books - list books with optional search and pagination
router.get('/', asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim();
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  // Partial, case-insensitive match on title, author, genre and year
  const options = {
    order: [['id', 'ASC']],
    limit: BOOKS_PER_PAGE,
    offset: (page - 1) * BOOKS_PER_PAGE
  };
  if (search) {
    const like = { [Op.like]: `%${search}%` };
    options.where = {
      [Op.or]: [
        { title: like },
        { author: like },
        { genre: like },
        where(cast(col('year'), 'TEXT'), like)
      ]
    };
  }

  const { count, rows: books } = await Book.findAndCountAll(options);
  const totalPages = Math.max(Math.ceil(count / BOOKS_PER_PAGE), 1);

  // A page past the end of the results doesn't exist
  if (page > totalPages) {
    const error = new Error("Sorry! We couldn't find the page you were looking for.");
    error.status = 404;
    throw error;
  }

  res.render('index', { title: 'Books', books, search, page, totalPages, count });
}));

// GET /books/new - show the new book form
router.get('/new', (req, res) => {
  res.render('new-book', { title: 'New Book', book: {} });
});

// POST /books/new - create a book
router.post('/new', asyncHandler(async (req, res) => {
  const data = getBookData(req.body);
  try {
    await Book.create(data);
    res.redirect('/books');
  } catch (error) {
    // Show validation messages and keep what the user typed
    if (error.name === 'SequelizeValidationError') {
      res.render('new-book', {
        title: 'New Book',
        book: { ...data, year: req.body.year },
        errors: error.errors
      });
    } else {
      throw error;
    }
  }
}));

// GET /books/:id - show the update form for one book
router.get('/:id', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (book) {
    res.render('update-book', { title: book.title, book });
  } else {
    next(notFound());
  }
}));

// POST /books/:id - update a book
router.post('/:id', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (!book) {
    return next(notFound());
  }
  const data = getBookData(req.body);
  try {
    await book.update(data);
    res.redirect('/books');
  } catch (error) {
    // Show validation messages and keep what the user typed
    if (error.name === 'SequelizeValidationError') {
      res.render('update-book', {
        title: 'Update Book',
        book: { id: book.id, ...data, year: req.body.year },
        errors: error.errors
      });
    } else {
      throw error;
    }
  }
}));

// POST /books/:id/delete - delete a book
router.post('/:id/delete', asyncHandler(async (req, res, next) => {
  const book = await Book.findByPk(req.params.id);
  if (!book) {
    return next(notFound());
  }
  await book.destroy();
  res.redirect('/books');
}));

module.exports = router;
