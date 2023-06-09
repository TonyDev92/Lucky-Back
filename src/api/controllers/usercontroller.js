const User = require('../models/usermodel');
const bcrypt = require('bcrypt');
const {generateSign} = require('../../utils/jsw');
const {validateEmail, validateEmailOnUse , validatePassword} = require('../../utils/validators');
const { put } = require('../routes/animales.routes');
const { deleteFile } = require('../../middleware/delete.file');

//LOGIN USER METHOD
const loginUser = async (req,res) => {

    try {
        const userData = await User.findOne({ email : req.body.email})
        if(!userData){
            return res.status(404).json({message: 'invalid email address'}); //TEST EMAIL
        }
        if(!bcrypt.compareSync(req.body.password , userData.password)){//TEST PASSWORD
            return res.status(404).json({message : 'invalid password'});
        }
        const token = generateSign(userData._id , userData.email)
        console.log( "user:" , userData , "token:", token);
        return res.status(200).json({userData, token}); //GENERATE TOKEN
        
    } catch (error) {
        return res.status(500).json(error)
    }
}

//END LOGIN 

//REGISTER  USER

const userRegister = async (req, res) => {
    try {
        const newUser = new User(req.body);

        if(!validateEmail(newUser.email)){ //TEST EMAIL
            return res.status(400).json({message : 'Invalid Email'});
        }
        if(!validatePassword(newUser.password)){ //TEST PASSWORD
            return res.status(400).json({message : 'Invalid Password'});
        }
        if( await validateEmailOnUse(newUser.email) > 0){ //TEST EMAIL ON USE
            return res.status(400).json({message: 'This email already on use'});
        }

        newUser.password = bcrypt.hashSync(newUser.password, 10); //HASH PASSWORD
        const newEmail = await newUser.save(); // SAVE THE NEW USER
        const token = generateSign(newEmail._id , newEmail.email)
        console.log(`user: ${newEmail} , token: ${token}`);
        return res.status(201).json({newEmail, token});

    } catch (error) {
        return res.status(500).json(error);
    }
}

const updateUserImage = async (req, res) => {
    try {
        const { id } = req.params;
        const putUser = new User(req.body);
        putUser._id = id;
        
        if(req.file) {
            putUser.imagen = req.file.path;
        }

        const updatedUser = await User.findByIdAndUpdate(id , putUser);

        if(updatedUser.imagen){
            deleteFile(updatedUser.imagen)
        }
        return !updatedUser ? res.status(404).json({ message : "user not found"}) : res.status(200).json(updatedUser);
    } catch (error) {
        return res.status(500).json(error)
    }
};

module.exports = {loginUser , userRegister ,updateUserImage};