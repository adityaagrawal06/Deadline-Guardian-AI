const User = require('../models/User');

// @desc    Update user profile (name and/or picture)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, pictureBase64 } = req.body;
    
    // Find the current user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Handle picture upload if provided (directly save Base64 string)
    if (pictureBase64) {
      user.picture = pictureBase64;
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  updateProfile
};
