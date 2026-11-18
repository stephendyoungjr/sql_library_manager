const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const { sequelize } = require('./models');
const indexRouter = require('./routes/index');
const booksRouter = require('./routes/books');

const app = express();

// View engine for pug templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes 
app.use('/', indexRouter);
app.use('/books', booksRouter);

// Sync model 
(async () => {
  try {
    await sequelize.sync();
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// 404 handler 
app.use((req, res, next) => {
  const error = new Error("Sorry! We couldn't find the page you were looking for.");
  error.status = 404;
  res.status(404).render('page-not-found', { error });
});

// Global error handler
app.use((err, req, res, next) => {
  
  err.status = err.status || 500;
  err.message = err.message || 'There was an unexpected error on the server.';
  console.log(`Error ${err.status}: ${err.message}`);

  res.status(err.status);
  if (err.status === 404) {
    res.render('page-not-found', { error: err });
  } else {
    res.render('error', { err });
  }
});

module.exports = app;
