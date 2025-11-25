import express from "express";
import cors from "cors";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import db from "./db.js"

const app = express();
app.use(cors());
app.use(express.json());



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, "")));
app.use(express.static(join(__dirname, "../frontend/dist")));

app.get('/uzytkownicy', async (req, res) =>{

  try {
    const [rows] = await db.query('SELECT * FROM uzytkownicy')
    res.json(rows)

  } catch(err){
    
    console.error('Błąd podczas pobierania gier:', err);
    res.status(500).send('Błąd serwera');
  }

  
})

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "../frontend/dist/index.html"));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server działa na porcie ${PORT}`));
