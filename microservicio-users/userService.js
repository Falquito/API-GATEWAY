import express from 'express';


const app = express()

app.use(express.json())


app.get('/data',(req,res)=>{
    //codigo para obtener data del usuario
    res.send(JSON.parse(req.headers["x-user-data"]))
})

app.post('/create',(req,res)=>{
    //codigo para crear un usuario
    res.json(req.body)
})


app.listen(3001,()=>{
    console.log("http://localhost:3001")
})