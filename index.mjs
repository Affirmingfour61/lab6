import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

const pool = mysql.createPool({
    host: "blonze2d5mrbmcgf.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "b97smy96oqfdk3k7",
    password: "blf4iq50oouz3klb",
    database: "t36g5dx2gs9g2xpp",
    connectionLimit: 10,
    waitForConnections: true
});

// Home Page - Shows Admin/Quick Links
app.get('/', (req, res) => {
    res.render('home.ejs');
});

// Add Quote Form (GET)
app.get('/addQuote', async(req, res) => {
    let [category] = await pool.query('SELECT DISTINCT category FROM quotes');
    let [authors] = await pool.query('SELECT DISTINCT firstName, lastName, authorId FROM authors');
    res.render('addQuote.ejs', {authors, category});
});

// Add Quote (POST)
app.post('/addQuote', async(req, res) => {
    // You may want to actually insert new quotes here; as written, it shows the quote form
    let [category] = await pool.query('SELECT DISTINCT category FROM quotes');
    let [authors] = await pool.query('SELECT DISTINCT firstName, lastName, authorId FROM authors');
    res.render('addQuote.ejs', {authors, category});
});

// Add Author Form (GET)
app.get('/addAuthor', (req, res) => {
    res.render('addAuthor.ejs');
});

// Add Author (POST)
app.post('/addAuthor', async (req, res) => {
    let firstName = req.body.fn;
    let lastName = req.body.ln;
    let dob = req.body.dob;
    let dod = req.body.dod;
    let bio = req.body.bio;
    let pic = req.body.pic;
    let gender = req.body.gender;
    let sql = `INSERT INTO authors
                (firstName, lastName, dob, dod, bio, pic, gender)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
    let sqlParams = [firstName, lastName, dob, dod, bio, pic, gender];
    await pool.query(sql, sqlParams);
    res.render('addAuthor.ejs');
});

// Search by keyword form
app.get('/search', (req, res) => {
    res.render('search.ejs', {results: null, error: ""});
});

app.post('/search', async (req, res) => {
    const keyword = req.body.keyword;
    if (!keyword || keyword.length < 3) {
        return res.render('search.ejs', { results: null, error: "Keyword must have at least 3 characters." });
    }
    let sql = `
        SELECT quotes.*, authors.firstName, authors.lastName, authors.authorId
        FROM quotes
        JOIN authors ON quotes.authorId = authors.authorId
        WHERE quote LIKE ? OR authors.firstName LIKE ? OR authors.lastName LIKE ?
    `;
    const [results] = await pool.query(sql, [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]);
    res.render('search.ejs', { results, error: "" });
});

app.get('/searchByCategory', async (req, res) => {
    const [categories] = await pool.query('SELECT DISTINCT category FROM quotes');
    res.render('searchCategory.ejs', { categories, results: null });
});


app.post('/searchByCategory', async (req, res) => {
    const [categories] = await pool.query('SELECT DISTINCT category FROM quotes');
    const { category } = req.body;
    const [results] = await pool.query(
        `SELECT quotes.*, authors.firstName, authors.lastName, authors.authorId FROM quotes 
        JOIN authors ON quotes.authorId = authors.authorId 
        WHERE category=?`, [category]
    );
    res.render('searchCategory.ejs', { categories, results });
});



app.get('/searchByAuthor', async (req, res) => {
    const [authors] = await pool.query('SELECT * FROM authors');
    res.render('searchAuthor.ejs', { authors, results: null });
});


app.post('/searchByAuthor', async (req, res) => {
    const [authors] = await pool.query('SELECT * FROM authors');
    const authorId = req.body.authorId;
    const [results] = await pool.query(
        `SELECT quotes.*, authors.firstName, authors.lastName, authors.authorId 
         FROM quotes JOIN authors ON quotes.authorId = authors.authorId 
         WHERE quotes.authorId=?`, [authorId]
    );
    res.render('searchAuthor.ejs', { authors, results });
});


app.get('/searchByLikes', (req, res) => {
    res.render('searchLikes.ejs', { results: null });
});


app.post('/searchByLikes', async (req, res) => {
    const { minLikes, maxLikes } = req.body;
    const [results] = await pool.query(
      `SELECT quotes.*, authors.firstName, authors.lastName, authors.authorId FROM quotes
       JOIN authors ON quotes.authorId = authors.authorId
       WHERE likes BETWEEN ? AND ?`, [minLikes, maxLikes]
    );
    res.render('searchLikes.ejs', { results });
});



app.get('/author/:authorId', async (req, res) => {
    const [authors] = await pool.query('SELECT * FROM authors WHERE authorId=?', [req.params.authorId]);
    res.json(authors[0]);
});



app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error!");
    }
});

app.listen(3000, ()=>{
    console.log("Express server running");
});
