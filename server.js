const bodyParser = require("body-parser");
const validator = require("deep-email-validator");
const express = require("express");


const app = express()

app.use(bodyParser.json())




app.get("/", (req,res) => {
    res.send("<p>What are you doing?</p>")
})


app.get("/validate/:email", async (req,res) => {

    const {email} = req.params
    
   let response = await validator.validate(email)

    res.send(response)
})

app.listen("4000", () => {
    console.log("Listen in port 4000")
})

