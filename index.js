const express = require('express');
const app = express();
const User = require("./model/userModel")
const nodemailer = require('nodemailer');
// const secure_configuration = require('./secure');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
require('dotenv').config()
// const config = process.eve;
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
if (typeof localStorage === "undefined" || localStorage === null) {
const LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');
}

// console.log(process.env.TOKEN_KEY)

 //for the env file 
// require('dotenv').config({path:''});

// const LocalStorage = require('node-localstorage').LocalStorage;

// Set EJS as templating engine
app.set('view-engine','ejs')
app.use(express.urlencoded({extended:false})) 
// app.use(express.urlencoded({extended:false})) 

app.use(require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));
 
//mongoose connectio with the mongoDB.
mongoose.connect(
	"mongodb://localhost:27017/finalPoc",
	{ useNewUrlParser: true },
	() => {
	  console.log("DB Connected");
	}
  );

app.get ("/",(req,res,next)=>{
 return res.render("index.ejs",{title :"Login System"})
})

// ===================================register=====================================


app.get ("/register",(req,res)=>{
	res.render("register.ejs")
   })


app.post('/register',async  function(req, res, next) {
	console.log(req.body);
	const personInfo = req.body;

	const encryptPassword = async (password) => {
		const pwd = await bcrypt.hash(password, 8);
		return pwd;
	  };

	// if(!personInfo.email || !personInfo.password || !personInfo.passwordConf){
	// 	res.send({"Fail":"Enter the data"});
	// } else {
		if (personInfo.password == personInfo.confirmpassword) {

			User.findOne({email:personInfo.email},async function(err,data){
				// if (data) {
				// 	console.log("the email already exist");
				// 	res.status(200).json({message : "Email Already Exists"})
				//   }else if(err){
				// 	res.status(200).json({message : "ERROR check the email and write again"})
				//   }
				  // validate pwd
				//   console.log(personInfo.password)
				//   console.log(personInfo.confirmpassword)
				if(!data){

						const hashPassword = await encryptPassword(personInfo.password);
						console.log("hash", hashPassword);
						personInfo.password = hashPassword;
						personInfo.confirmpassword = hashPassword;
						console.log(personInfo);

						const newPerson = new User({
							fname: personInfo.fname,
							lname: personInfo.lname,
							email: personInfo.email,
							contact: personInfo.contact,
							orgainisation:personInfo.orgainisation,
							designation: personInfo.designation,
							password: hashPassword,
							confirmpassword: hashPassword
							// password: personInfo.password,
							// passwordConf: personInfo.passwordConf
						});

						newPerson.save(function(err, result){
							if (err) {
								console.log(err);
								res.render("register.ejs");
							}else{
								// localStorage.setItem('fname', result.fname);
								// console.log(result.fname);
								console.log('sending')
								const smtpConfig = {
									service: 'gmail',
									auth: {
										user:  "komalpatel12341@gmail.com",
										pass: "tpwktisnoesyncbd"
									}
								};
								const transporter = nodemailer.createTransport(smtpConfig);
								
									console.log("the sending email will be",result.email)
									// console.log("the sending email will be",transporter)
									const mailConfigurations = {
										from: "komalpatel12341@gmail.com",
										to: result.email,
										subject: 'Sending Email using Node.js',
										html: ' hello!'
									    +'This mail is being sent to verify your gmail account.'
										+'Below is the link so i can go to the Login Page'
										+'                                               '
										+'<a href="http://localhost:3001/login ">CLICK HERE TO LOGIN</a>'
									}; 
				
									transporter.sendMail(mailConfigurations, function(error, info){
										if (error){
											console.log('Error Email');	
											console.log(error)
										} else{
											console.log('Email Sent Successfully');
										// console.log(info);
										}

										
									});

							  }
						});

					// res.send({"Success":"You are regestered,You can login now."});

					// console.log("the value from the env file email",process.env.ENV_EMAIL)
					// console.log("the value from the env file password ",process.env.ENV_PASSWORD)
					
					res.render("welcome.ejs", {name : personInfo.fname})


				}else{
					// res.send({"Success":"Email is already used."});
					res.render("login.ejs")

				}

			});
		}else{
			res.send({"Success":"password is not matched"});
		}
	// }
});
// ===================================login=====================================
app.get('/login',function (req, res) {
	 res.render('login.ejs');
});

app.post('/login', function (req, res) {
	console.log('login', req.body);
	// localStorage.setItem('email', req.body.email);
	User.findOne({email:req.body.email},function(err,data){
		// console.log(data.email);
		if(data){
			bcrypt.compare(req.body.password, data.password,async(err, pwdRes)=>{
			  if(pwdRes){
				localStorage.setItem('email', data.email);
				console.log("email stored from login",localStorage.getItem('email'));



				  const secret = speakeasy.generateSecret({length: 20});
				  console.log(secret); // Save this value to your DB for the user
				  
				  // generate the QRcode
				  // const QRvalue = 
				  console.log("the base32 value on authentication get")
				//   localStorage.setItem('secretcode', secret.base32);
				//   console.log("secretcode stored from authentication",localStorage.getItem('secretcode'));
				  
				  const update = { secretcode:secret.base32};
				  let doc = await User.findOneAndUpdate({_id: data._id}, update, { });
				  console.log(doc);
				  
				      QRCode.toDataURL(secret.otpauth_url, (err, image_data)=>  {
					  
					  console.log("entered the saving data of image" ); // A data URI for the QR code image
					//   localStorage.setItem('qrvalue', image_data);
					//   console.log("qrvalue stored from authentication",localStorage.getItem('qrvalue'));
					  
				  	  res.render("authentication.ejs",{qrvalue : image_data})

			        });
		 




				}else{
					res.send({"Success":"Wrong password!"});
					res.redirect("login.ejs")

				}
		    });
	    }else{
			res.send({"Success":"This Email Is not regestered!"});
			res.render("register.ejs")
			  }
	});
});
// ===================================login end=====================================

// ===================================welcome =====================================

//to get into welcome page
app.get('/welcome',(req,res)=>{
	// localStorage.setItem('email', email);
    // localStorage.getItem('email'));
	User.findOne({email:localStorage.getItem('email')},(err, result) => {
	// 	console.log("email from result ", result)
	// 	if(result){
	// 		User.findByEmail(result.email,function (err,em){
	// 			console.log("name stored from login",localStorage.getItem('fname'));
				res.render("welcome.ejs",{"name": result.fname}) })
			// })
		// }
    // })
})
// ===================================welcome end=====================================

// ===================================verifiedLogin =====================================

//to get into welcome page
// app.get('/verifiedLogin',(req,res)=>{
// 	res.render("verifiedLogin.ejs") 
//   })

//to know that the user is authenticated
app.get('/verifiedLogin',(req,res)=>{
	res.render("verifiedLogin.ejs") 

	console.log("entered verification")
})

	// const retrievedemail = localStorage.getItem(req.email); 
    //  console.log("email from local storage",req.email)
	// User.findOne({email:retrievedemail},(err, result) => {
	//   //generate the sectret key
	//   const secret = speakeasy.generateSecret({length: 20});
	//   console.log(secret); // Save this value to your DB for the user
	  
	//   // generate the QRcode
	//   // const QRvalue = 
	//   QRCode.toDataURL(secret.otpauth_url, (err, image_data)=>  {
	// 	console.log(image_data); // A data URI for the QR code image
	// 	// const imageQR=image_data;
	// 	res.render('verifiedLogin.ejs',{imageData:image_data})
	//   });
	//     User.updateOne({email:result.email}, {$set: {secretcode:req.body.secret}},(err,result)=>{
	// 	if(result){
	// 	  //verify the QRcode
	// 	  speakeasy.totp.verify({
	// 	  secret: result.secretcode,
	// 	  encoding:"base32",
	// 	  token:req.body.qrvalue
	// 	  })
	// 	}else if(err){
	// 	doctument.write("the value you entered is invalid");
	// 	res.render("verifiedLogin.ejs")
	// 	}
	//   });
	// write('<img src="' + image_data + '">');
	
// 	res.render("authentication.ejs")
//   })
// ===================================verifiedLogin end=====================================


// ===================================authentication =====================================
app.get('/authentication',(req,res)=>{
	res.send("hello get Auth")
	// User.findOne({email:localStorage.getItem('email')},async (err, result) => {
	// 	console.log("email from result ", result)
	// 	console.log("email from result ", result.email)

	// 	if(result){
	// 		//generate the sectret key
	// 		const secret = speakeasy.generateSecret({length: 20});
	// 		console.log(secret); // Save this value to your DB for the user
			
	// 		// generate the QRcode
	// 		// const QRvalue = 
	// 		console.log("the base32 value on authentication get")
	// 		localStorage.setItem('secretcode', secret.base32);
	// 		console.log("secretcode stored from authentication",localStorage.getItem('secretcode'));
			
	// 		const update = { secretcode:localStorage.getItem('secretcode')};
	// 		let doc = await User.findOneAndUpdate({_id: result._id}, update, { });
	//         console.log(doc);
			
	// 		QRCode.toDataURL(secret.otpauth_url, (err, image_data)=>  {
	// 			console.log(image_data); // A data URI for the QR code image
				
	// 			console.log("entered the saving data of image" ); // A data URI for the QR code image
	// 			localStorage.setItem('qrvalue', image_data);
	// 			console.log("qrvalue stored from authentication",localStorage.getItem('qrvalue'));
				
	//   });
	// }else{
		// 	res.send("the error message while generating code")
		// }
		//   })
		
	res.render("authentication.ejs")
})


//to get into the profile page
app.post('/authentication',(req,res)=>{
	
	
	
	User.findOne({email:localStorage.getItem('email')},(err, result) => {

		console.log("enterted into the authentication post")
		console.log(result)
		
		if(result){
			
			// to see the token value
			// const token = speakeasy.totp({
			// 	secret: result.secretcode,
			// 	encoding: 'base32',
			//   });
			//    console.log("the token value ",token);
			  

			//   //verify the QRcode
			  const verified = speakeasy.totp.verify({
				secret:  result.secretcode,
				encoding: 'base32',
				token: req.body.authentication_code,
			   });
			   
			// to check the verified token  is true or false
		  console.log("to verify the token=",verified);
		  if (!verified){
			//   res.render("authentication.ejs")
			res.send("please enter the token.")
			
		   }else{
			   // generating token for validation
			    const token = jwt.sign({  
				exp: Math.floor(Date.now() / 1000) + (6 * 60),
				data : {_id :result._id, email:result.email}},
				process.env.TOKEN_KEY);
			    console.log("token from the authentication part ",token);
				localStorage.setItem('token', token);
				console.log("token stored from login",localStorage.getItem('token'));
				res.render("profile.ejs")
			// res.send("please enter the token.")

		    }
		}else if(err){
		doctument.write("the value you entered is invalid");
		res.render("verifiedLogin.ejs")
		}
	 
	
	})
  })
 

// =================================== profile =====================================
app.get('/profile', function (req, res) {
	res.render("profile.ejs");
});

app.post('/profile', function (req, res, next) {
	console.log("profile");
	User.findOne({email:localStorage.getItem('email')},function(err,data){
		console.log("entered the data")
		console.log(req.body.data);

		console.log(data);
		if(!data){
			res.redirect('/');
		}else{
			//console.log("found");
			res.render('profile.ejs', {"name":data.username,"email":data.email});
		}
	});
});
// ===============================About  ===========================?

app.get('/about', function (req, res) {
	User.findOne({email:localStorage.getItem('email')},function(err,data){
		// const decodingJWT = (token) => {
		// 	const decoded = jwt.verify(token,process.env.TOKEN_KEY );
		// 	//  console.log("decodeing the values");
		// 	//  console.log("decodeing the ID:-"+ decoded.data._id);
		// 	//  console.log("decodeing Email :-"+decoded.data.email);
		// 	return decoded
		//   }
		//   decode
				const token =localStorage.getItem('token')
                const decoded = jwt.verify(token,process.env.TOKEN_KEY );
                console.log("decodeing the values");
                console.log("decodeing the ID:-"+ decoded.data._id);
                console.log("decodeing Email :-"+decoded.data.email);

				User.findOne({_id:decoded.data._id},function(err,data){
					if(data){
						console.log("you can access the about page")
						res.render("about.ejs");
					}else{
						console.log("you are NOT authorized to access the about page")
						res.send("you are not authorized to access the data")
					}

				})

                
	})
});



// ===============================Log Out  ===========================?

app.get('/logout', function (req, res) {
// 	 res.render("logout.ejs")
res.render("logout.ejs",{clickHandler: "func1();"})
});

// app.post('/logout', function (req, res) {
// 	const html = template.render({
// 		clickHandler: "func1();"
// 	 })
// 	 console.log("html from logout page",html)
// 		// res.render("logout.ejs",{clickHandler: "func1();"})
// });


app.post('/logout', function (req, res) {
	console.log("logout")
	// res.render("logout.ejs",{clickHandler: "func1();"})

	console.log("secssion logout",req.session)

	if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
    	if (err) {
    		res.send("logout error");
    	} else {
    		res.redirect('/');
    	}
    });
}
});
// ===============================Forget Password ===========================?

// sending mail for forget password

app.get('/forgetEmail', function (req, res, next) {
	res.render("forgetEmail.ejs");
});
app.post('/forgetEmail', function (req, res, next) {
	console.log("from the forget email",req);
	User.findOne({email:req.body.email},function(err,data){
	if (data){
		console.log("email from forget email for check",data.email)
		const smtpConfig = {
	    	service: 'gmail',
	    	auth: {
	    		user:  "komalpatel12341@gmail.com",
	        	pass: "tpwktisnoesyncbd"
	        }
	    };
		const transporter = nodemailer.createTransport(smtpConfig);
	
		console.log("the sending email from the forget password",data.email)
		// console.log("the sending email will be",transporter)
		const mailConfigurations = {
			from: "komalpatel12341@gmail.com",
			to: data.email,
			subject: 'Sending Email using Node.js',
			html: ' hello!'
			+'This mail is being sent to reset yor password from gmail account.'
			+'Below is the link so i can get into the reset password'
			+'                                               '
			+'<a href="http://localhost:3001/forget ">FORGET PASWORD</a>'
		}; 

		transporter.sendMail(mailConfigurations, function(error, info){
			if (error){
				console.log('Error in sending Email for rest password');	
				console.log(error)
			} else{
				console.log('Email for reset password is  Sent Successfully');
			// console.log(info);
			}
		});
    }
    });
});

app.get('/forget', function (req, res, next) {
	res.render("forget.ejs");
});

app.post('/forget', function (req, res) {
	//console.log('req.body');
	//console.log(req.body);
	User.findOne({email:req.body.email},async function(err,data){
		console.log("data from forget password",data);
		const encryptPassword = async (password) => {
			const pwd = await bcrypt.hash(password, 8);
			return pwd;
		  };
		if(!data){
			res.send({"Success":"This Email Is not regestered!"});
		}else{
			// res.send({"Success":"Success!"});
			if (req.body.password==req.body.confirmpassword) {
				const hashPassword = await encryptPassword(req.body.password);
				console.log("hash from the forget password", hashPassword);
				data.password = hashPassword;
				data.confirmpassword = hashPassword;
			

			data.save(function(err, result){
				if(err)
					console.log(err);
				else
					console.log('Success');
					res.send({"Success":"Password changed!"});
			});
		}else{
			res.send({"Success":"Password does not matched! Both Password should be same."});
		}
		}
	});
	
});
// ===============================Update ===========================?
app.get('/update', function (req, res) {
	console.log("am in update");

	res.render("update.ejs");
});
app.post('/update',  function (req, res) {

	console.log("am in update post");
	console.log(req.body)

		


	User.findOne({email:localStorage.getItem('email')},async function(err,data){
		console.log("entered the update part")
		console.log(data)
		if(data){

			const update = { 
							
							fname: req.body.fname,
							lname: req.body.lname,
							email: req.body.email,
							contact: req.body.contact,
							orgainisation:req.body.orgainisation,
							designation: req.body.designation}
							 	// password: hashPassword,
							 	// confirmpassword: hashPassword };

			let doc = await User.findOneAndUpdate({_id: data._id}, update, {
								
							  });
			console.log(doc);
			
			console.log("data first name from the update menu");
			console.log(req.body.fname);

			// console.log(updateUser);
			// if (updateUser) {
			//   res.json({ message: "updated data" });
			// } else {
			//   console.log("Error occur while updating the data");
			// }

			// updateUser.save(function(err, result){
			// 	if (err) {
			// 		console.log(err);
			// 		res.render("register.ejs");
			// 	}else{
			// 		localStorage.setItem('fname', result.fname);
			// 		console.log(result.fname);
			// 		res.render("welcome.ejs");
			// 	  }
			// });

		// res.send({"Success":"You are regestered,You can login now."});
		res.render("welcome.ejs")
	}else{
		// res.send({"Success":"Email is already used."});
		res.render("login.ejs")

	}
// ----------------------------------------------------------------------------------------
		// console.log("entered the update part")
		// console.log(data.body)
        // const updateUser = await User.findByIdAndUpdate(data._id, {
		// 	fname: req.boby.fname,
		// 	lname: req.boby.lname,
		// 	contact: req.boby.contact,
		// 	orgainisation:req.boby.orgainisation,
		// 	designation: req.boby.designation,
		// 	password: hashPassword,
		// 	confirmpassword: hashPassword
		//   });
		//   console.log(updateUser);
		//   if (updateUser) {
		// 	res.json({ message: "updated data" });
		//   } else {
		// 	console.log("Error occur while updating the data");
		//   }
		// })
// ----------------------------------------------------------------------------------------

	})
	
	res.render("update.ejs");
});
// ===============================Delete ===========================?

app.get('/delete', function(req, res, next) {	


	User.findOne({email:localStorage.getItem('email')},async function(err,data){
		console.log("entered the delete part")
		console.log(data)
		if(data){

			let doc = await User.findOneAndDelete({_id: data._id});
			console.log(doc);
			res.redirect("/");
		}else{
			res.redirect("/profile");

		}


	// const email = new ObjectId(req.params.email)
	// User.remove({"email": email}, function(err, result) {
	// 	if (err) {
	// 		// req.flash('error', err)
	// 		// redirect to users list page
	// 		res.redirect('/profile')
	// 	} else {
	// 		// req.flash('success', 'User deleted successfully! id = ' + req.params.id)
	// 		// redirect to users list page
	// 		res.redirect('/login')
	// 	}
	})	
})


app.listen(3001, () => {
    console.log("application is listening to port 3001");
  })
  