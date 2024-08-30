const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const bodyParser = require('body-parser');
const he = require('he');

const app = express();
app.use(bodyParser.json());

app.post('/convert', async (req, res) => {
    const { ApiKey, ValorBusqueda } = req.body;

    // Validar los parámetros
    if (!ApiKey || !ValorBusqueda) {
        return res.status(400).send('ApiKey y ValorBusqueda son requeridos');
    }

    // Construir el XML Request
    const xmlRequest = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
            <soapenv:Header/>
            <soapenv:Body>
                <gxv:wsGestionAbonado.BUSCARABONADOV2>
                    <gxv:Entrada>{
                        "ApiKey":"${ApiKey}",
                        "ValorBusqueda":"${ValorBusqueda}"
                    }</gxv:Entrada>
                </gxv:wsGestionAbonado.BUSCARABONADOV2>
            </soapenv:Body>
        </soapenv:Envelope>
    `;

    // Log del XML Request
    console.log('XML Request:', xmlRequest);

    try {
        // Enviar el request SOAP
        const { data } = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest175/servlet/awsgestionabonado?wsdl', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'BUSCARABONADOV2'
            }
        });

        // Log de la respuesta SOAP
        console.log('SOAP Response:', data);

        // Convertir la respuesta XML a JSON
        const parsedResponse = await parseStringPromise(data, { explicitArray: false });
        const salida = parsedResponse['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsGestionAbonado.BUSCARABONADOV2Response'].Salida;

        // Decodificar entidades HTML y convertir a JSON
        const decodedSalida = he.decode(salida);
        const jsonResponse = JSON.parse(decodedSalida);

        // Enviar la respuesta JSON al cliente
        res.json(jsonResponse);

    } catch (error) {
        console.error('Error processing SOAP request:', error.message);
        res.status(500).send(`Error processing request: ${error.message}`);
    }
});

app.listen(3000, () => {
    console.log('API is running on http://localhost:3000');
});
