import deepValidator from "deep-email-validator"
import express from "express"
import dns from "dns"

const app = express();
app.use(express.json())

app.get("/validate/:email", async (req, res) => {
    const { email } = req.params;
    let domain = email.split("@");
    domain = domain[1];

    let maxTimeout = 50000;
    let responseTimeOut = 0
    let verified = { valid: false, verified_type: 'random', msg: "err", intent: 0 }


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
            verified.valid = await deepValidator.validate(email).then((result) => {
                if (result.valid) {
                    let validators = result.valid.validators

                    if (validators.regex.valid) {
                        if (validators.smtp.valid) {
                            return true;
                        }
                    }
                }

                if (!verified.valid) {
                    verified.msg = result.reason
                }
            })

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