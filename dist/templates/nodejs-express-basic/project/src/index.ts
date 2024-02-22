import express from 'express'
const app = express()

app.get('/', (req, res) => {
  res.status(200).send('¡Hola mundo!')
})

app.listen(3001, () => {
  console.log(`Servidor escuchando en el puerto 3001`)
})