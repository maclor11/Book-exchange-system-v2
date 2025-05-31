require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');

// Inicjalizacja aplikacji Express
const app = express();

// Połączenie z bazą
connectDB();

// Ścieżka do folderu uploads z .env lub domyślna
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');

// Middleware
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Serwowanie plików statycznych uploads
app.use('/uploads', express.static(UPLOADS_PATH));

// Publiczne trasy - dostępne bez autoryzacji
app.use('/api/public', require('./routes/publicRoutes'));

// Trasy wymagające autoryzacji
app.use('/api', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/user', require('./routes/bookRoutes')); 
app.use('/api/user', require('./routes/wishlistRoutes')); 
app.use('/api/user', require('./routes/ratingRoutes')); 

app.use('/api/user', require('./routes/tradeRoutes'));

// Serwowanie frontendu
const frontendPath = path.join(__dirname, '../Web-Frontend');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));