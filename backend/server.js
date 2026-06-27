const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "mysql-db",
  user: "root",
  password: "root123",
  database: "todo_db"
});

db.connect((err) => {
  if (err) {
    console.error("MYSQL CONNECTION ERROR:", err);
  } else {
    console.log("MYSQL CONNECTED");
    db.query(
      "CREATE TABLE IF NOT EXISTS todos (id INT AUTO_INCREMENT PRIMARY KEY, text VARCHAR(255) NOT NULL)",
      (err) => {
        if (err) {
          console.error("Error creating table:", err);
        } else {
          console.log("Table 'todos' verified/created");
        }
      }
    );
  }
});

app.get("/todos", (req, res) => {
  db.query(
    "SELECT * FROM todos",
    (err, result) => {
      if (err) {
        console.error("GET /todos error:", err);
        return res.status(500).json(err);
      }
      res.json(result);
    }
  );
});

app.post("/todos", (req, res) => {
  const { text } = req.body;
  db.query(
    "INSERT INTO todos(text) VALUES(?)",
    [text],
    (err, result) => {
      if (err) {
        console.error("POST /todos error:", err);
        return res.status(500).json(err);
      }
      res.json({
        message: "Todo Added"
      });
    }
  );
});

app.listen(5000, () => {
  console.log("SERVER STARTED");
});