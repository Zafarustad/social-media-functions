//email validation
/* eslint-disable */
const isEmail = (email) => {
  const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegex)) return true;
  return false;
};

//check for empty feild
const isEmpty = (value) => {
  if (value.trim() === '') return true;
  return false;
};

const checkLimit = (value) => {
  const limitRegex = /^.{1,200}$/;
  if (value.match(limitRegex)) return true;
  return false;
};

//validate before signup
exports.validateSignupData = (data) => {
  let errors = {};

  if (!isEmail(data.email)) {
    errors.email = 'Must be a valid email';
  }
  if (isEmpty(data.email)) {
    errors.email = 'Must not be empty';
  }
  if (isEmpty(data.password)) {
    errors.password = 'Must not be empty';
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords must match';
  }
  if (isEmpty(data.username)) {
    errors.username = 'Must not be empty';
  }
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

//validate before login
exports.validateLoginData = (data) => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = 'Must not be empty';
  }
  if (isEmpty(data.password)) {
    errors.password = 'Must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};

//add user details
exports.reduceUserDetails = (data) => {
  let userDetails = {};

  if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;

  if (!isEmpty(data.website.trim())) {
    if (data.website.trim().substring(0, 4) !== 'http') {
      userDetails.website = `http://${data.website.trim()}`;
    } else userDetails.website = data.website;
  }

  if (!isEmpty(data.location.trim())) userDetails.location = data.location;

  return userDetails;
};

//check post body limit
exports.validatePostSpark = (value) => {
  let errors = {};

  if (!checkLimit(value)) {
    errors.body = 'Must be 200 characters';
  }
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false,
  };
};
