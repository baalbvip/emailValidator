const deepValidator = require("deep-email-validator")
const express = require("express")
const dns = require("dns")
const verifier = require("email-verifier")
const emailVerify = require('email-verify');
const net = require("net");
const { exec } = require("child_process");

const app = express();
app.use(express.json())

app.get("/validate/:email", async (req, res) => {
    const { email } = req.params;
    let domain = email.split("@");
    domain = domain[1];

    let maxTimeout = 50000;
    let responseTimeOut = 0
    let verified = { valid: false, verified_type: 'random', msg: "err", intent: 0 }

    const newIntent = () => {
        verified.intent = verified.intent + 1;
    }


    responseTimeOut = setTimeout(() => {
        verified.msg = "Timeout"
        verified.timeout = true;
        res.send(verified)
    }, maxTimeout)

    let smtp, verifiedDomain;

    // verifica que el dominio sea verdadero
    await new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address, family) => {
            if (err) {
                verifiedDomain = false
            } else {
                verifiedDomain = true
            }

            resolve("f");
        })
    })


    if (verifiedDomain) {
        // verificame que el mx sea verdadero y tenga registro de smtp
        smtp = await new Promise((resolve, reject) => {
            return dns.resolveMx("wildreds.es", (err, address) => {
                resolve(address[0].exchange);
            });
        })
    }



    if (verifiedDomain !== undefined && verifiedDomain !== false) {
        if (smtp !== undefined) {

            // Pasa por el validador mas estricto, si este devuelve false y los mensajes son raros pasemos por otro validador
            await deepValidator.validate(email).then((result) => {
                newIntent()

                if (result.valid) {
                    let validators = result.validators
                    if (validators.regex.valid) {
                        if (validators.smtp.valid) {
                            verified.valid = true
                        }
                    }
                }
                if (!verified.valid) {
                    verified.msg = result.reason
                }
            })



            if (verified.valid == false && verified.msg == "typo" || verified.msg == "smtp" && verified.valid == false) {
                await new Promise((resolve, reject) => {
                    exec(`email-verify ${email}`, (err, output) => {
                        newIntent()
                        console.log("segundo intento")

                        if (err) {
                            console.log(err)
                        } else {
                            let out = JSON.stringify(output)

                            if (out.status == true) {
                                verified.valid = true
                            }
                        }

                        resolve(true)
                    })
                })
            }



        }
    } else {
        verified.msg = "Domain invalid or Smtp invalid"
    }

    if (verified.msg !== "Timeout") {
        clearTimeout(responseTimeOut)
        res.send(verified);
    }
})

app.listen(4000, () => {
    console.log("Reproduciendo en el puerto 4000");
})