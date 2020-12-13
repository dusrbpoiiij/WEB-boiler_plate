const express = require('express')
const bodyParser = require('body-parser');
const config = require('./config/key');
const cookieParser =require('cookie-parser');
const { auth } = require('./middleware/auth');
const { User } = require('./models/User');


const app = express()

// application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({extended: true}));

// application/json 
app.use(bodyParser.json());

// cookie parser 
app.use(cookieParser());


// MongoDB
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
}).then(() => console.log('MongoDB Connected.....'))
  .catch(err => console.log(err));


// Default 
app.get('/', (req, res) => {
  res.send('Hello World!~~~안녕하세요')
})


app.get('/api/hello', (req, res) => {
  res.send('Hello my friend!')
})

//TODO: 회원 가입 할 때 필요한 정보들을 Client에서 가져오면 데이터 베이스에 넣어준다. 
app.post('/api/users/register', (req, res) => {
  const user = new User(req.body);
  user.save((err, userInfo) => {
    if(err) return res.json({ success: false, err})
    return res.status(200).json({
      success: true
    })
  });
})

//TODO: Login
app.post('/api/users/login', (req,res) => {
  // 요청된 이메일을 데이터베이스에서 있는지 찾는다. 
  User.findOne({ email: req.body.email }, (err, user) => {
    if(!user) {
      return res.json({
        loginSuccess: false,
        message: "제공된 이메일에 해당하는 유저가 없습니다."
      })
    }

    // 요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호인지 확인 
    user.comparePassword(req.body.password , (err, isMatch) => {      
      if(!isMatch || err) 
        return res.json({ loginSuccess: false, message: "비밀번호가 틀렸습니다."})
    
      // 비밀번호까지 맞다면 토큰 생성하기 
      user.generateToken((err, user) => {
        if(err) return res.status(400).send(err);
        
        // 토큰을 저장한다. 어디에? 쿠키, 로컬스토리지, ... (쿠키)
        res.cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id})
      })
    })
  })
})

//TODO: 쿠키에 있는 token과 DB의 token 비교를 통한 사용자 확인 
app.get('/api/users/auth', auth ,(req,res) => {
  // 여기까지 미들웨어를 통과했다는 얘기는 Authenticate 이 True 
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true, 
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role:req.user.role,
    image:req.user.image
  })
})


//TODO: 로그아웃 : 데이터베이스의 Token을 지워준다. (그러면 앞으로 auth 미들웨어에서 다 걸리게 됨)
app.get('/api/users/logout', auth, (req, res) => {
  User.findOneAndUpdate({_id: req.user._id}, 
  { token: "" }
  , (err,user) => {
    if (err) return res.json({ success: false, err});
    return res.status(200).send({
      success: true 
    })
  })
})

const port = 5000
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})