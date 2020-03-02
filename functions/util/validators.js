const isEmail = email => {
  const emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegex)) return true;
  return false;
};

const isEmpty = value => {
  if (value.trim() === "") return true;
  return false;
};

exports.validateSignupData = data => {
  let errors = {};

  if (!isEmail(data.email)) {
    errors.email = "Must be a valid email";
  }
  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  }
  if (isEmpty(data.password)) {
    errors.password = "Must not be empty";
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }
  if (isEmpty(data.username)) {
    errors.username = "Must not be empty";
  }
  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};

exports.validateLoginData = data => {
  let errors = {};

  if (isEmpty(data.email)) {
    errors.email = "Must not be empty";
  }
  if (isEmpty(data.password)) {
    errors.email = "Must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  };
};
