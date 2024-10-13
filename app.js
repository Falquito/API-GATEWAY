import exp from 'constants';
import express from 'express';
import jwt from 'jsonwebtoken'
//proxy inverso que me redirigira a los endpoints necesarios.
import { createProxyMiddleware } from 'http-proxy-middleware'
// Definir las URLs de los microservicios
const USERS_SERVICE = 'http://localhost:3001';

const app = express()
app.use(express.json())
//middleware para autentidar usuarios
app.use((req,res,next)=>{
    //rescato el token del header en formato Authorization: Bearer token...
    const token = req.headers.authorization.split(' ')[1];
    //intento verificar el token que agarre
    try {
        const token_decoded= jwt.verify(token,"hola")
        console.log("USUARIO VALIDOOOO",token_decoded)
        //antes de avanzar por el endpoint, guardo mi token decodificado en mi request
        req.token_decoded=token_decoded;

        //si esta todo bien va para el endpoint necesario
        next()
    } catch (error) {
        return res.status(401).json({mensaje: "TOKEN INVALIDO O EXPIRADO"})
    }
})

//redirijo las request a /users al microservicio de Usuarios
app.use('/user', createProxyMiddleware({
    target: USERS_SERVICE,
    changeOrigin: true,
    selfHandleResponse: true, // Habilitar selfHandleResponse para manipular la respuesta si es necesario,
    on: {
        // Interceptar la request antes de enviarla al microservicio
        proxyReq: (proxyReq, req, res) => {
            if (req.token_decoded) {
                //agrego el token en los headers
                proxyReq.setHeader('x-user-data',JSON.stringify(req.token_decoded))
                if(Object.keys(req.body).length > 0){
                    //convierto el body en string y luego a buffer para enviarlo
                    console.log(req.body)
                    const bodyStr=JSON.stringify(req.body);
                    const bodyBuffer = Buffer.from(bodyStr)
    
                    //establezco el nuevo body en la proxyReq
                    proxyReq.setHeader('Content-Length',bodyBuffer.length)
                    proxyReq.setHeader('Content-Type','application/json')
                    proxyReq.write(bodyBuffer);
                    proxyReq.end()
                }
            }
        },
        proxyRes: (proxyRes,req,res)=>{
            let body = '';
            proxyRes.on('data', (chunk) => {
                body += chunk;
            });
            console.log(body)
            proxyRes.on('end', () => {
                try {
                    const parsedData = JSON.parse(body);
                    console.log("Respuesta del microservicio Users:", parsedData);
                    // Reenvío la respuesta decodificada al cliente
                    res.status(200).json(parsedData);
                } catch (err) {
                    console.error("Error al parsear la respuesta del microservicio:", err);
                    res.status(500).send('Error en la respuesta del microservicio');
                }
            });
        },
        error: (err, req, res) => {
            console.log("Error en el proxy", err);
            res.status(500).send('Proxy error');
        }
    }
}));

app.listen(3000,()=>{
    console.log("listen in http://localhost:3000")
})