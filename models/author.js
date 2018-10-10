const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date}
  }
);

// Virtual for author's full name
AuthorSchema
  .virtual('name')
  .get(function () {
    return `${this.family_name}, ${this.first_name}`
  });

// Virtual for author's lifespan
AuthorSchema
  .virtual('lifespan')
  .get(function () {
    return `${this.date_of_birth ? moment(this.date_of_birth).format('MMMM Do YYYY') : 'Unknown'} - ${this.date_of_death ? moment(this.date_of_death).format('MMMM Do YYYY') : 'Present'} `
  });

// Virtual for formatted author's date of birth
AuthorSchema
  .virtual('date_of_birth_formatted')
  .get(function () {
    return this.date_of_birth ? moment(this.date_of_birth).format('MMMM Do YYYY') : 'Unknown';
  });

// Virtual for formatted author's date of death
AuthorSchema
  .virtual('date_of_death_formatted')
  .get(function () {
    return this.date_of_death ? moment(this.date_of_death).format('MMMM Do YYYY') : 'Present';
  });

// Virtual for author's URL
AuthorSchema
  .virtual('url')
  .get(function () {
    return `/catalog/author/${this._id}`
  });

module.exports = mongoose.model('Author', AuthorSchema)