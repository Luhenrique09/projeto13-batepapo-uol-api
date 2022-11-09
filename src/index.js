import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

mongoClient
    .connect()
    .then(() => {
	    db = mongoClient.db("Bate_PapoUol"); 
    })
    .catch(err => console.log(err))

app.post("/participants", (req, res) => {
    const {name} = req.body;
    
    db.collection("participants").insertOne({
        name: name, lastStatus: Date.now()
    }).then(response => {
        
        res.status(201).send('usuario logado com sucesso!');
    }).catch(err => res.status(500).send(err));
    
})



app.listen(5000, () => console.log("Server running in port: 5000"));