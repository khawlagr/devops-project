require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const path=require('path');

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
  res.render('main', { user: req.session.user });
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
  res.redirect('/index');
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
  res.redirect('/index');
});



// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});



// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Animal data
const animals = [
  {
    id: 1,
    name: 'Lion',
    species: 'Panthera leo',
    category: 'Mammals',
    habitat: 'Savanna',
    description: 'The lion is a large cat of the genus Panthera native to Africa and India. It has a muscular, broad-chested body, short, rounded head, round ears, and a hairy tuft at the end of its tail.',
    image: '/images/lion.jpg'
  },
  {
    id: 2,
    name: 'Elephant',
    species: 'Loxodonta africana',
    category: 'Mammals',
    habitat: 'Forests, Savannas',
    description: 'Elephants are the largest existing land animals. They have a trunk, tusks, large ear flaps, pillar-like legs, and tough but sensitive skin. They are considered to be very intelligent animals.',
    image: '/images/elephant.jpg'
  },
  {
    id: 3,
    name: 'Penguin',
    species: 'Spheniscidae',
    category: 'Birds',
    habitat: 'Antarctica',
    description: 'Penguins are a group of aquatic flightless birds. They are highly adapted for life in the water, with their wings having evolved into flippers. They spend about half of their lives on land and half in the oceans.',
    image: '/images/penguin.jpg'
  },
  {
    id: 4,
    name: 'Tiger',
    species: 'Panthera tigris',
    category: 'Mammals',
    habitat: 'Forests',
    description: 'The tiger is the largest living cat species and a member of the genus Panthera. It is recognizable by its dark vertical stripes on orange-brown fur. It is an apex predator, primarily preying on ungulates.',
    image: '/images/tiger.jpg'
  }
];

// Routes
app.get('/index', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('index', { 
    title: 'Welcome to Animal World', 
    animals: animals,
    user: req.session.user
  });
});


app.get('/animal/:id', (req, res) => {
  const animal = animals.find(a => a.id === parseInt(req.params.id));
  if (!animal) return res.status(404).send('Animal not found');
  
  res.render('animal', { 
    title: animal.name, 
    animal: animal 
  });
});

app.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Animal World' 
  });
});



app.listen(3000, () => {
  console.log("http://localhost:3000");
});
