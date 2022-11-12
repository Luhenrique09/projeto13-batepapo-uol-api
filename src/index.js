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
        return res.status(422).send(errors);

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
    const { limit } = req.query;
    const userLogged = req.headers.user
    try {
        const message = await db.collection("message").find().toArray()
        const messagesPrivate = message.filter((obj) =>
        ((obj.type === "message") ||
            (obj.to === "Todos") ||
            (obj.to === userLogged && obj.type === "private_message") ||
            (obj.from === userLogged))
        )
        if (userLogged) {
            if (limit) {
                res.send(messagesPrivate.slice(-limit));
            }
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

app.post("/status", async (req, res) => {
    const user = req.headers.user
    const participant = {
        name: user,
        lastStatus: Date.now(),
    }
    try {
        const name = await db.collection("participants").findOne({ name: user })

        if (!name) {
            res.sendStatus(404)
            return;
        }
        await db.collection("participants").updateOne({ _id: name._id }, { $set: participant })
        res.sendStatus(200)
    } catch (err) {
        res.sendStatus(500)
    }


})
setInterval(async () => {
    const dateNew = Date.now();
    try {
        const usersOff = await db.collection("participants").find({}).toArray();
        const userDelete = usersOff.find((obj) => obj.lastStatus < dateNew - 15000)
        if (userDelete) {
            await db.collection("participants").deleteOne({ name: userDelete.name })
            await db.collection("message").insertOne({
                from: userDelete.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: `${dayjs().$H}:${dayjs().$m}:${dayjs().$s}`
            })
        }
    } catch { }
}, 15000);


app.listen(5000, () => console.log(`Server running in port: ${5000}`)); 