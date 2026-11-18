'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Book extends Model {}

  Book.init({
    // Title is required
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Title is required' },
        notEmpty: { msg: 'Title is required' }
      }
    },
    // Author is required
    author: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Author is required' },
        notEmpty: { msg: 'Author is required' }
      }
    },
    // Genre is optional
    genre: DataTypes.STRING,
    // Year is optional but has to be a whole number when provided
    year: {
      type: DataTypes.INTEGER,
      validate: {
        isInt: { msg: 'Year must be a whole number' }
      }
    }
  }, {
    sequelize,
    modelName: 'Book'
  });

  return Book;
};
