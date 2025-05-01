require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));


// Accueil
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});


// Signup

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.render('signup', { error: 'Nom d\'utilisateur ou email déjà utilisé' });
  }

  if (password !== confirmPassword) {
    return res.render('signup', { error: 'Les mots de passe ne correspondent pas' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });
  await user.save();

  req.session.user = user;
  res.redirect('/profile');
});



// Login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  console.log(req.body);  // Ajoute cette ligne

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.render('login', { error: 'Utilisateur introuvable' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.render('login', { error: 'Mot de passe incorrect' });

  req.session.user = user;
  res.redirect('/profile');
});




// Profil
app.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('profile', { user: req.session.user });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
