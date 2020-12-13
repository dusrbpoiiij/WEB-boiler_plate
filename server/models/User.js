const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    maxlength: 50
  },
  email: {
    type:String,
    trim:true,
    unique: 1
  },
  password: {
    type:String,
    minlength:5
  },
  lastname: {
    type:String,
    maxlength:50
  },
  role: {
    type:Number,
    default: 0
  },
  image: String,
  token: {
    type: String
  },
  tokenExp: {
    type:Number
  }
})

//TODO: 비밀 번호를 암호화 
userSchema.pre('save', function( next ){
  var user = this;
  // 비밀번호가 변경될 때만 암호화 
  if (user.isModified('password')) {
    bcrypt.genSalt(saltRounds, function(err, salt) {
      if(err) return next(err)

      bcrypt.hash( user.password , salt , function(err, hash) {
        if(err) return next(err)
        user.password = hash
        next();
      })
    }) 
  } else {
    next();
  }
})

//TODO: 비밀번호 비교 (로그인)
userSchema.methods.comparePassword = function(plainPassword, cb) {
  console.log(plainPassword);
  console.log(this.password);
  bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
    if(err) return cb(err);
    cb(null, isMatch);
  })
}


//TODO: Token 생성 
userSchema.methods.generateToken = function(cb) {
  var user = this;
  // jsonwebtoken 을 이용하여 token 생성 
  var token = jwt.sign(user._id.toHexString(), 'secretTokenYeonkyu');
  user.token = token 
  user.save(function(err, user) {
    if(err) return cb(err);
    cb(null, user);
  })
}

//TODO: Token 복호화 
userSchema.statics.findByToken = function(token, cb) {
  var user = this;

  // 토큰을 decoded 
  jwt.verify(token, 'secretTokenYeonkyu', function(err, decoded) {
    // 유저 아이디를 이용해서 유저를 찾은 다음에 클라이언트에서 가져온 Token과 DB에 보관된 토큰이 일치하는지 확인 
    user.findOne({"_id": decoded, "token": token}, function(err, user) {
      if(err) return cb(err);
      cb(null, user);
    })
  })
}

const User = mongoose.model('User', userSchema);

module.exports = {User};