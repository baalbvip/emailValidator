const deepValidator = require("deep-email-validator")
const express = require("express")
const dns = require("dns")
const verifier = require("email-verifier")
const emailVerify = require('email-verify');
const net = require("net")

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
            deepValidator.validate(email).then((result) => {
                verified.intent + 1;

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



            if (verified.valid == false && verified.msg == "typo" || verified.msg == "smtp") {

            }


            try {
                // Intentar conectar con el servidor SMTP
                const socket = await net.createConnection(25, domain);
                const response = await socket.read();
                // Enviar comandos SMTP para verificar el correo electrónico
                socket.write(`HELO ${domain}\r\n`);
                await socket.read();
                socket.write(`MAIL FROM: <benavides21francisco@gmail.com>\r\n`);
                await socket.read();
                socket.write(`RCPT TO: <baalbvip@gmail.com>\r\n`);
                const respuesta = await socket.read();
                // Si la respuesta contiene 250, el correo existe
                if (respuesta.includes('250')) {
                    console.log(`El correo electrónico ${email} existe.`);
                    return true;
                } else {
                    console.log(`El correo electrónico ${email} no existe.`);
                    return false;
                }
                
                await socket.end();
            } catch (error) {
                console.log(`Error al verificar el correo electrónico ${email}: ${error}`);
                return false;
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