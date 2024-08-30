const express = require('express');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/convert', async (req, res) => {
    const { ApiKey, ValorBusqueda } = req.body;

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

    try {
        // Enviar el request SOAP
        const { data } = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest175/servlet/awsgestionabonado?wsdl', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'BUSCARABONADOV2'
            }
        });

        // Convertir la respuesta XML a JSON
        const parsedResponse = await parseStringPromise(data, { explicitArray: false });
        const salida = parsedResponse['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsGestionAbonado.BUSCARABONADOV2Response'].Salida;

        // Enviar la respuesta JSON al cliente
        res.json(JSON.parse(salida));

    } catch (error) {
        console.error('Error processing SOAP request:', error);
        res.status(500).send('Error processing request');
    }
});

app.listen(3000, () => {
    console.log('API is running on http://localhost:3000');
});