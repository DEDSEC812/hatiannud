const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err));

const LinkSchema = new mongoose.Schema({
  section: String,
  title: String,
  url: String
});

const Link = mongoose.model("Link", LinkSchema);

app.get("/links", async (req,res)=>{
  const links = await Link.find();

  let data = { canaux:[], groupes:[], reseaux:[], contact:[] };

  links.forEach(link=>{
    if(data[link.section]){
      data[link.section].push(link);
    }
  });

  res.json(data);
});

app.post("/add", async (req,res)=>{
  const {section,title,url} = req.body;
  await Link.create({section,title,url});
  res.json({message:"Added"});
});

app.post("/delete", async (req,res)=>{
  const {id} = req.body;
  await Link.findByIdAndDelete(id);
  res.json({message:"Deleted"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log("Server running"));
