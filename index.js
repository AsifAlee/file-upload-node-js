const express = require("express");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2"); // Or mongoose for MongoDB
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection (MySQL example)
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "test",
});

db.connect((err) => {
  if (err) {
    console.log("the error thrown is:", err);
    throw err;
  }
  console.log("Connected to the database!");
});
console.log(
  "db host:",
  process.env.DB_HOST,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  process.env.DB_NAME
);

// Set up Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload route

app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  // Save file details to the database
  const sql =
    "INSERT INTO myFiles (filename, path, mimetype, size) VALUES (?, ?, ?, ?)";
  const values = [file.filename, file.path, file.mimetype, file.size];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).send("Database error: " + err.message);
    res.status(200).send({ message: "File uploaded successfully", file: file });
  });
});

app.get("/create-customers-table", (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error creating table:", err.message);
      return res.status(500).send("Error creating customers table.");
    }
    res.send("Customers table created successfully.");
  });
});

app.get("/file/:filename", (req, res) => {
  console.log("file routes", __dirname);
  const { filename } = req.params;

  // Construct the file path
  const filePath = path.join(__dirname, "uploads", filename);
  console.log("filepath:", filePath);

  // Check if the file exists
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err.message);
      res.status(404).send("File not found.");
    }
  });
});

app.post("/add-customer", (req, res) => {
  const { name, phone } = req.body;
  console.log(name);

  if (!name || !phone) {
    return res.status(400).send("Name and phone are required.");
  }

  const sql = "INSERT INTO customers (name, phone) VALUES (?, ?)";
  db.query(sql, [name, phone], (err, result) => {
    if (err) {
      console.error("Error inserting customer:", err.message);
      return res.status(500).send("Error adding customer.");
    }
    res.send({
      message: "Customer added successfully.",
      customerId: result.insertId,
    });
  });
});

app.get("/", (req, res) => {
  res.send("Hello file uploader");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
