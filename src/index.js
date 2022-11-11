import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dayjs from "dayjs";
import dotenv from "dotenv"
import joi from "joi";

const participantsSchema = joi.object({
    name: joi.string().required().min(3),
})

const messagesSchema = joi.object({
    from: joi.string(),
    to: joi.string(),
    text: joi.string(),
    type: joi.string(),
    time: joi.string(),
});

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    mongoClient.connect()
    db = mongoClient.db("Bate_PapoUol");
} catch (err) {
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
        const nome = await db.collection("participants").findOne({ name: name });
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
        await db.collection("message").insertOne({
            from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: `${dayjs().$H}:${dayjs().$m}:${dayjs().$s}`
        })
        res.status(201);
    } catch {

    }
})

app.get("/participants", async (req, res) => {

    try {
        const participants = await db.collection("participants").find().toArray();
        res.send(participants);
    } catch (err) {
        res.status(500).send(err);
    }

})

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body
    const from = req.headers.user
    const body = req.body


    const validation = messagesSchema.validate(body, { abortEarly: false });
    try {
        const participant = await db.collection("participants").findOne({ name: from });
        if (!participant) {
            res.sendStatus(409)
            return
        }
    } catch {

    }
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(422).send(errors);
        return;
    }

    try {
        await db.collection("message").insertOne({
            from,
            to,
            text,
            type,
            time: `${dayjs().$H}:${dayjs().$m}:${dayjs().$s}`
        })
        res.status(201);
    } catch (err) {
        res.status(422).send(err)
    }
})

app.get("/messages", async (req, res) => {

    try {
        const message = await db.collection("message")
            .find()
            .toArray()
        res.send(message);
    } catch (err) {
        res.status(500).send(err);
    }


})

async function deleted() {
   
}

setInterval(deleted, 15000);

app.listen(5000, () => console.log("Server running in port: 5000"));