const jwt = require('jsonwebtoken');
const client = require('../redis'); // Ensure you have your Redis client set up

const authenticateToken = async (req, res, next) => {
  const accessToken = req.header('Authorization')?.replace('Bearer ', '');
  const refreshToken=req.body.token;  // Optionally, check for refresh token in the body
  if (!accessToken) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  try {
      // Verify the access token
      const decodedAccessTokenPayload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
   
      // Check if the tokenType is 'access' (reject refresh tokens)
      if (decodedAccessTokenPayload.tokenType !== 'access') {
       return res.status(403).json({ message: 'Invalid token: Refresh token used as access token.' });
     }
    const isAccessBlacklisted = await client.get(accessToken);
    if (isAccessBlacklisted === 'blacklisted') { // Check if the access token is blacklisted (due to logout)
      return res.status(403).json({ message: 'Access Token is blacklisted. Please log in again.' });
    }

    req.user = decodedAccessTokenPayload; // Attach user information to request
    // While access token is valid, the refresh token should not be allowed to perform any actions
    // if (refreshToken) {
    //   return res.status(400).json({ message: 'Access token is still valid. Refresh token is not needed yet.' });
    // }
    
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Access token expired, allow refresh token if provided
      if (refreshToken) {
        const isRefreshBlacklisted = await client.get(refreshToken);
        if (isRefreshBlacklisted === 'blacklisted') {
          return res.status(403).json({ message: 'Refresh token is blacklisted' });
        }
        // Proceed to refresh token logic in controller
        return next();
      }

      return res.status(403).json({ message: 'Access token expired. Please refresh your token.' });
    } else {
      return res.status(403).json({ message: 'Invalid token' });
    }
  }
};

module.exports = authenticateToken;
