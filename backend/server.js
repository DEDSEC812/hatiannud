const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const FILE = "links.json";

// 🔍 GET all links
app.get("/links", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(FILE));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Error reading database" });
  }
});

// ➕ ADD link
app.post("/add", (req, res) => {
  const { section, title, url } = req.body;

  if (!section || !title || !url) {
    return res.status(400).json({ error: "Missing data" });
  }

  let data = JSON.parse(fs.readFileSync(FILE));

  if (!data[section]) {
    data[section] = [];
  }

  data[section].push({ title, url });

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.json({ message: "Link added" });
});

// 🗑 DELETE link
app.post("/delete", (req, res) => {
  const { section, index } = req.body;

  let data = JSON.parse(fs.readFileSync(FILE));

  if (!data[section] || !data[section][index]) {
    return res.status(400).json({ error: "Invalid index" });
  }

  data[section].splice(index, 1);

  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  res.json({ message: "Link deleted" });
});

// ❤️ TEST route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// 🔥 IMPORTANT FOR RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
