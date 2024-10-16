const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { generateAccessToken , generateRefreshToken} = require('../utils/tokenUtils');
const client = require('../redis'); 
const jwt= require('jsonwebtoken');
const {blacklistAccessToken, blacklistRefreshToken}=require('../controllers/blacklistController');
const { where } = require('sequelize');
const user = require('../models/user');
const nodemailer=require('nodemailer');



const authController = {
  signUp: async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Check if the email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashedPassword });
      
      console.log('New User Created:', newUser);
      res.status(201).json({ 
        message: 'User created successfully',
        user: {
          id: newUser.id
        }
       });
    } catch (err) {
      console.error(err);  // Log the actual error for better debugging
      res.status(500).json({ message: 'Error creating user' });
    }
  },

  signIn: async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(400).json({ message: 'User not found' });

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(400).json({ message: 'Incorrect password' });

      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token in the database (optional, for added security)
      user.refreshToken = refreshToken; // You might want to implement this in your User model
      await user.save();
      res.json({ message: 'Login successful', accessToken,refreshToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error during sign in'});
    }
  },

  refreshToken: async (req, res) => {
    const accessToken = req.header('Authorization')?.replace('Bearer ', '');
    const token  = req.body.token;
    if (!token){
      console.log('refresh token is missing');
      return res.sendStatus(401); // Unauthorized
    } 

    try {
          // 1. Check if the refresh token is blacklisted
      const isRefreshBlacklisted = await client.get(token);
      if (isRefreshBlacklisted === 'blacklisted') {
        console.log(`Attempted use of blacklisted refresh token: ${token}`);
        return res.status(403).json({ message: 'Refresh token is blacklisted. Please log in again.' });
      }
      
          const decodedRefreshTokenPayload = await jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
              // Log the decoded payload and user ID for debugging
          console.log("Decoded Refresh Token Payload:", decodedRefreshTokenPayload);
      
          const userId = decodedRefreshTokenPayload?.id;
          // Log the user ID to verify if it's correct
          console.log("decodedRefreshTokenPayload User ID:", userId); 
          if (!userId) {
            console.error('User ID is missing from refresh token. Refresh token might be invalid.');
            return res.status(400).json({ message: 'Invalid refresh token. No user ID found.' });
          }

          const user = await User.findOne({ where: { id: userId } });

      // const user = await User.findOne({ where: { id: decodedRefreshTokenPayload.userId } });
      
      if (!user) {
        console.error('User not found for ID:', userId);
        return res.status(404).json({ message: 'User not found' });
      }
     
      // Issue a new access token and a new refresh token
      const newAccessToken = generateAccessToken(user.id);
      console.log(`Generated new access token for user and the access token is: ${user.id, newAccessToken}`);
     
       // Issue a new refresh token every time
      const newRefreshToken = generateRefreshToken(user.id);
      console.log(`Generated new refresh token for user and the access token is: ${user.id, newRefreshToken}`);

      // Store refresh token in the database (optional, for added security)
     
        
          user.refreshToken = newRefreshToken;  // Invalidate refresh token in the database
          await user.save();
          console.log(`Refresh token updated in database for user: ${user.id}`);
      
      
      const blacklistedAccessToken = await blacklistAccessToken(accessToken);
      if(blacklistedAccessToken){
        console.log(`old access token blacklisted: ${accessToken}`);
      }else{
        console.log("failed to blacklist token access");
      }
      
      const blacklistedRefreshToken = await blacklistRefreshToken(token);
      if(blacklistedRefreshToken){
        console.log(`old refresh token blacklisted: ${token}`);
      }else{
        console.log("failed to blacklist token refresh");
      }

      res.json({
        accessToken:newAccessToken ,
        refreshToken: newRefreshToken 
      });

    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.error('RT expired', err);
        res.status(500).json({ message: 'RT expired...' });
      }
      console.error('Error refreshing token:', err);
      res.status(500).json({ message: 'Error refreshing token' });
    }
  },

  

  logout: async (req, res) => {
    const accessToken = req.header('Authorization')?.replace('Bearer ', '');
    const refreshToken = req.body.token;

    if (!accessToken && !refreshToken) {
      return res.status(400).json({ message: 'Token is required for logout' });
    }

    try {
      // 2. If the access token is still valid
      let decodedAccessToken;
      try {
        decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
      } catch (err) {
        decodedAccessToken = null;  // If expired or invalid
      }

      // 2. Blacklist the access token
      const timeToExpire = decodedAccessToken.exp - Math.floor(Date.now() / 1000); // Get remaining expiration time
      await client.set(accessToken, 'blacklisted', 'EX', timeToExpire); // Blacklist the access token
      console.log(`Access token blacklisted for user: ${decodedAccessToken.id}`);

      // 3. Blacklist the refresh token, if provided
      if (refreshToken) {
        await client.set(refreshToken, 'blacklisted', 'EX', 3600); // Assuming a 1-hour expiry
        console.log(`Refresh token blacklisted for user: ${decodedAccessToken.id}`);

        const user = await User.findOne({ where: { id: decodedAccessToken.id } });
        if (user) {
          user.refreshToken = null;  // Invalidate refresh token in the database
          await user.save();
          console.log(`Refresh token invalidated in database for user: ${decodedAccessToken.id}`);
        }
      }
      res.status(200).json({ message: 'Logout successful' });

    } catch (err) {
      // If access token is expired
      if (err.name === 'TokenExpiredError') {
        // 4. If access token is expired, allow logout using refresh token
        if (refreshToken) {
          const isRefreshBlacklisted = await client.get(refreshToken);
          if (isRefreshBlacklisted === 'blacklisted') {
            return res.status(403).json({ message: 'Refresh token is blacklisted. Please log in again.' });
          }

          // Blacklist the refresh token
          await client.set(refreshToken, 'blacklisted', 'EX', 3600); // 1-hour expiry
          console.log(`Refresh token blacklisted`);

          const user = await User.findOne({ where: { refreshToken } });
          if (user) {
            user.refreshToken = null;
            await user.save();
            console.log(`Refresh token invalidated for user: ${user.id}`);
          }

          return res.status(200).json({ message: 'Logout successful' });
        }
        return res.status(400).json({ message: 'Refresh token required' });
      }

      console.error('Error during logout:', err);
      res.status(500).json({ message: 'Error logging out' });
    }
  },

  forgotPassword:async(req,res)=>{
    const { email } = req.body;

    try {
      // Step 1: Validate if email exists in the database
      const user = await User.findOne({ where: { email } });
      if (!user) {
        console.log(`User with email ${email} not found for password reset.`);
        return res.status(404).json({ message: 'User not found' });
      }
      console.log(`Password reset requested for user: ${email}`);
      // Step 2: Generate a password reset token (JWT)
      const resetToken = jwt.sign({ email, tokenType:'reset' }, process.env.RESET_TOKEN_KEY, {expiresIn: '1h' // Token expiry in 1 hour
      });

      // Step 3: Send reset link via email
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset',
        text: `Click on the link to reset your password: ${resetLink}`
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ 
        message: 'Password reset link sent'  ,
        user:{email:user.email}});

    } catch (error) {
      console.error('Error sending reset link:', error);
      res.status(500).json({ message: 'Error sending reset link'
      });
    }
    },

    resetPassword: async(req,res)=>{
      const { token, newPassword, confirmNewPassword } = req.body;

      // Password validation regex (at least 8 characters, one lowercase, one uppercase, one digit, one special character)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!]).{8,}$/;

      try {
        // Step 1: Verify the reset token
        const decoded = jwt.verify(token, process.env.RESET_TOKEN_KEY);
        // Step 2: Ensure tokenType is 'reset'
        if (decoded.tokenType !== 'reset') {
          return res.status(403).json({ message: 'Invalid token type. Only reset tokens are allowed.' });
        }
        // Step 2: Validate if passwords match
        if (newPassword !== confirmNewPassword) {
          return res.status(400).json({ message: 'Passwords do not match' });
        }

        // Step 3: Validate if the new password meets the criteria
        if (!passwordRegex.test(newPassword)) {
          return res.status(400).json({
            message:
              'Password must be at least 8 characters long and include one uppercase, one lowercase, one digit, and one special character',
          });
        }

        // Step 4: Find the user based on the decoded email (from the reset token)
        const user = await User.findOne({ where: { email: decoded.email } });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Step 5: Hash and update the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password reset successful',
          user:{email:user.email}
         });
      } catch (error) {
        console.error('Error resetting password:', error);
        if(error.name==='TokenExpiredError'){
          return res.status(400).json({ message: 'Reset token expired' });

        }
        res.status(500).json({ message: 'Invalid or expired token' });
      }
    },

    resendLink : async (req, res) => {
      const { email } = req.body;
      const token = req.header('Authorization')?.replace('Bearer ', '');
    
      try {
        // Step 1: Verify the access token
        const decodedAccessToken = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!decodedAccessToken || decodedAccessToken.tokenType !== 'access') {
          return res.status(401).json({ message: 'Unauthorized' });
        }
    
        // Step 2: Validate the email exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        // Step 3: Generate reset token and resend email as before
        const resetToken = jwt.sign({ email }, process.env.RESET_TOKEN_KEY, {
          expiresIn: '1h'
        });
    
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
    
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Resend Password Reset Link',
          text: `Click on the link to reset your password: ${resetLink}`
        };
    
        await transporter.sendMail(mailOptions);
    
        res.status(200).json({ message: 'Password reset link resent' });
    
      } catch (error) {
        console.error('Error resending reset link:', error);
        res.status(500).json({ message: 'Error resending reset link' });
      }
    }
    


};

module.exports = authController;
