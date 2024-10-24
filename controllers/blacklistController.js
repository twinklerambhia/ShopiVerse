const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { generateAccessToken , generateRefreshToken} = require('../utils/tokenUtils');
const client = require('../redis'); 
const jwt= require('jsonwebtoken');

const blacklistController={
    blacklistAccessToken: async(accessToken)=>{
        try{
          const decodedAccessToken = jwt.decode(accessToken);
          if(!decodedAccessToken){
            console.log('Invalid access token');
          return false; // Invalid token
          }
          const timeToExpire=decodedAccessToken.exp - Math.floor(Date.now() / 1000);
             // Blacklist the access token with remaining expiration time in seconds
        await client.set(accessToken, 'blacklisted', 'EX', timeToExpire);
        console.log(`Access token blacklisted for user: ${decodedAccessToken.id}`);
        return true; // Successfully blacklisted
        
        }catch(error){
          console.error('Error blacklisting access token:', error);
        return false; // Error occurred
        }
      },

      
  blacklistRefreshToken: async(refreshToken)=>{
    try{
      const decodedRefreshToken = jwt.decode(refreshToken);
      if(!decodedRefreshToken){
        console.log('Invalid refresh token');
      return false; // Invalid token
      }
      const timeToExpire=decodedRefreshToken.exp - Math.floor(Date.now() / 1000);
         // Blacklist the access token with remaining expiration time in seconds
    await client.set(refreshToken, 'blacklisted', 'EX', timeToExpire);
    console.log(`Refresh token blacklisted for user: ${decodedRefreshToken.id}`);
    return true; // Successfully blacklisted
    
    }catch(error){
      console.error('Error blacklisting refresh token:', error);
    return false; // Error occurred
    }
  }


};
module.exports=blacklistController;