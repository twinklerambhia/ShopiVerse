const jwt = require('jsonwebtoken');
const client = require('../redis'); 
const refreshMiddleware=async(req,res,next)=>{

    const accessToken = req.header('Authorization')?.replace('Bearer ', '');
    const refreshToken=req.body.token; 

    if (!accessToken) {
        return res.status(401).json({ message: 'access token required' });
      }
    try{
        const isAccessBlacklisted = await client.get(accessToken);
        if (isAccessBlacklisted === 'blacklisted') { // Check if the access token is blacklisted (due to logout)
            return res.status(403).json({ message: 'Access Token is blacklisted. Please log in again.' });
        }
          // Decode token without verifying it first (to check type)
  const decodedToken = jwt.decode(accessToken);

  if (decodedToken.tokenType === 'refresh') {
    return res.status(400).json({ message: 'Refresh token cannot be used in place of access token.' });
  }
        console.log("hello");
            // Verify the access token
        const decodedAccessTokenPayload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
        console.log(`decoded access token payload is ${decodedAccessTokenPayload},${decodedAccessTokenPayload.tokenType} `);

         // If the access token is valid, the refresh token should not be allowed to perform any actions
          // Check if the tokenType is 'access' (reject refresh tokens)
        if (decodedAccessTokenPayload.tokenType !== 'access') {
          console.error(error);
            return res.status(403).json({ message: 'Invalid token: Refresh token used as access token.' });
        }
        return res.status(400).json({ message: 'Access token is still valid. No need to use refresh token.' });
       
        req.user = decodedAccessTokenPayload;
                
      }catch(err){
        if(err.name==='TokenExpiredError'){
            if(!refreshToken){
                return res.status(401).json({ message: 'Refresh token is required to refresh access token' });
            }

            // Check if the refresh token is blacklisted
            const isRefreshTokenBlacklisted = await client.get(refreshToken);
            if (isRefreshTokenBlacklisted === 'blacklisted') {
                return res.status(403).json({ message: 'Refresh token is blacklisted. Please log in again.' });
            }

             // Verify the refresh token
            try {
                const decodedRefreshTokenPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
                req.user = decodedRefreshTokenPayload; // Attach user info to request
                next(); // Proceed to the refresh token logic in the controller
            } catch (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }
        } else {
      return res.status(403).json({ message: 'Invalid access token' });
    }
  }
};

module.exports = refreshMiddleware;
        