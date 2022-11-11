import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv"
import joi from "joi";

const participantsSchema = joi.object({
    name: joi.string().required().min(3),
})

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    mongoClient.connect()
    db = mongoClient.db("Bate_PapoUol");
} catch (err){
    console.log(err)
}

app.post("/participants", async (req, res) => {
    const { name } = req.body;

    const body = req.body

    const validation = participantsSchema.validate(body, { abortEarly: false });

    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(422).send(errors);
        return;
    }

    try {
        const nome = await db.collection("participants").findOne({name: name});
        if (nome) {
            res.sendStatus(409)
            return
        }
    } catch {
       
    }    

    try {
        await db.collection("participants").insertOne({
            name: name, lastStatus: Date.now()
        })

        res.status(201).send('usuario logado com sucesso!');
    } catch (err) {
        res.status(422).send(err)
    }

    try {
        await db.collection("mensage").insertOne({
            from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: `${dayjs().$H}:${dayjs().$m}:${dayjs().$s}`
        })
        res.status(201);
    } catch {

    }
})

app.get("/participants", (req, res) => {

    db.collection("participants")
        .find()
        .toArray()
        .then((participants) => {
            res.send(participants);
        }).catch(err => {
            res.status(500).send(err);
        })

})

app.post("/messages", (req, res) => {
    const { to, text, type } = req.body
    const { from } = req.headers.user

    db.collection("message").insertOne({
        from,
        to,
        text,
        type,
        time: `${dayjs().$H}:${dayjs().$m}:${dayjs().$s}`
    }).then(response => {
        res.status(201);
    }).catch(err => res.status(422).send(err));

})

app.get("/messages", (req, res) => {

    db.collection("mensage")
        .find()
        .toArray()
        .then((mensage) => {
            res.send(mensage);
        }).catch(err => {
            res.status(500).send(err);
        })


})
function apagaUser() {

}
setInterval(apagaUser, 15000);

app.listen(5000, () => console.log("Server running in port: 5000"));