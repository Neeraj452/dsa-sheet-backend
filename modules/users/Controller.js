const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../../utils');
const JWT_SECRET = process.env.JWT_SECRET 
const JWT_EXPIRES_IN = '7d'; 


  const registerUser= async (req, res) => {
    const {name,  email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email already in use' });

      const passwordHash = await hashPassword(password);

      const user = new User({name, email, passwordHash });
      await user.save();

      res.status(201).json({ message: 'User created successfully', user, status:201 });
    } catch (err) {
      res.status(500).json({ error: err.message,status:500 });
    }
  }

  const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
      const payload = {
        userId: user._id,
        email: user.email,
      };
  console.log(JWT_SECRET,JWT_EXPIRES_IN,payload);
      const token =  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  
      res.status(200).json({
        message: 'Login successful',
        status: 200,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message, status: 500, token: null });
    }
  }

module.exports = {
    registerUser,
    loginUser
}
