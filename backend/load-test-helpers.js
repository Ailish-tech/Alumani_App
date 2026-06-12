function setRandomAuthHeader(requestParams, context, ee, next) {
  // Random user from test-user-1 to test-user-100
  const randomUserId = Math.floor(Math.random() * 100) + 1;
  const role = randomUserId % 3 === 0 ? 'ALUMNI' : (randomUserId % 3 === 1 ? 'STUDENT' : 'FACULTY');
  
  // The dev middleware allows passing token in format: Bearer dev:<uid>:<role>
  requestParams.headers = {
    ...requestParams.headers,
    'Authorization': `Bearer dev:test-user-${randomUserId}:${role}`
  };
  
  return next();
}

module.exports = {
  setRandomAuthHeader
};
