// HELPER FUNCTIONS
const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(regEx)) return true;
    else return false;
}
const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
};

exports.validateSignUp = (data) => {
    let errors = {};
    if(isEmpty(data.email)) {
        errors.email = 'Must not be empty'
    } else if (!isEmail(data.email)){
        errors.email = 'Must be a vaild email address'
    }

    if(isEmpty(data.password)) errors.password = 'Must not be empty';
    if(data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if(isEmpty(data.handle)) errors.handle = 'Must not be empty';
// CHECK FOR ERRORS
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.validateLogin = (data) => {
    let errors = {};
    if (isEmpty(data.email)) errors.email = 'Must not be empty';
    if (isEmpty(data.password)) errors.password = 'Must not be empty';
    // CHECK FOR ERRORS
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    };
};

exports.reduceUserDetails = (data) => {
    let userDetails = {};
    // TRIM WHITESPACE
    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if(!isEmpty(data.location.trim())) userDetails.location = data.location;
    if(!isEmpty(data.website.trim())){
        // CHECK IF WEBSITE IS HTTP IF NOT ADD THE HTTP
        if(data.website.trim().substring(0, 4) !== 'http'){
            userDetails.website = `http://${data.website.trim()}`;
        } else userDetails.website = data.website;
    }
    return userDetails;
}