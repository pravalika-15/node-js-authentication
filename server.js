const express = require('express')
const app = express()
const dotenv = require('dotenv')
const morgan = require('morgan')
const bcrypt = require("bcrypt");
const bodyparser = require('body-parser');
const path = require('path')
// const controller = require("./server/controller/controller")
const axios = require("axios");
const sessions = require('express-session');
const cookieParser = require("cookie-parser");


// creating 24 hours from milliseconds
const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

dotenv.config();
var User = require('./model')

const mongoose = require('mongoose');

const mongodb = async() => {
    try {
        const con = await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser:true,
            useUnifiedTopology:true,
            // useFindAndModify:false,
            // useCreateIndex:true
        })

        console.log("mongodb connected")
    } catch(err){
        console.log(err);
        process.exit(1);
    }
}

mongodb()

//Cookie-parser usage so that the server can access the necessary option to save, read and access a cookie.
app.use(cookieParser());

// console logs msgs for every request
app.use(morgan('tiny'))
app.use(bodyparser.json())
app.use(express.json());

// parse request to body parser
app.use(bodyparser.urlencoded({extended:true}))

// set view engine 
app.set("view engine", "ejs")


app.get('/', (req,res) => {
    var session=req.session;
    console.log(session)
    if(session.userid){
        res.redirect('/home')

    }else
    res.render("index.ejs")
})

app.get('/register', (req,res) => {
    res.render("register.ejs")
})

const saltRounds = 10;

app.post('/register', async(req,res) => {
    if (!req.body){
        res.status(400).send({message:"content cannot be empty!"})
        return;
    }
    const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPwd,
    })
    console.log(req.body)

    user
        .save(user)
        .then(data => {
            // res.send(data)
            var session=req.session;
            session.userid=req.body.email;
            console.log(session)
            res.redirect('/home')
        })
        .catch (err => {
            res.status(500).send({
                message:err.message || "error occurred"
            });
            console.log(user)
        });
})

app.get('/login', (req,res) => {
    res.render("login.ejs")
})

app.post('/get-login', async (req,res) => {
    const { email , password } = req.body
    const checkpwd = await bcrypt.hash(password, saltRounds);
  // Check if username and password is provided

  console.log(req.body)

    try {
        const user = await User.findOne({ email, checkpwd })
        console.log(user)
        if (!user) {
          res.status(401).json({
            message: "Login not successful",
            error: "User not found",
          })
        } else {
        //   res.status(200).json({
        //     message: "Login successful",
        //     user,
            
        //   })
        var session=req.session;
            session.userid=req.body.email;
            console.log(session)
            res.redirect('/home')
        // const cmp = await bcrypt.compare(req.body.password, user.password);
        // if (cmp) {
        //     var session=req.session;
        //     session.userid=req.body.email;
        //     console.log(session)
        //     res.redirect('/home')
        // } else {
        //     res.send("Wrong username or password.");
        // }
    }
        
    } catch (error) {
        res.status(400).json({
          message: "An error occurred",
          error: error.message,
        })
      }

})


app.get('/home', (req, res) => {
    res.render("home.ejs")
})
app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/')
})

app.get('/delete', async(req,res) => {
    const { id } = req.body
  await User.findById(id)
    .then(user => user.remove())
    .then(user =>
      res.status(201).json({ message: "User successfully deleted", user })
    )
    .catch(error =>
      res
        .status(400)
        .json({ message: "An error occurred", error: error.message })
    )

})





app.listen(3000, () => {
    console.log("hello again")
})



// hello organiz ation and node js authentication project in mongo db