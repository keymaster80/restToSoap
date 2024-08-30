const express = require('express');
const xml2js = require('xml2js');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Ruta para recibir JSON y convertirlo a XML
app.post('/convert', (req, res) => {
    const jsonInput = req.body;

    // Convertir JSON a XML
    const builder = new xml2js.Builder();
    const xmlOutput = builder.buildObject(jsonInput);

    res.header('Content-Type', 'application/xml');
    res.send(xmlOutput);
});

app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});

