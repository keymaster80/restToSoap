const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const he = require('he'); // Para desescapar entidades HTML

const app = express();
app.use(express.json());

app.post('/convert', async (req, res) => {
    try {
        // Construye el XML Request desde el JSON recibido
        const jsonInput = req.body;
        const xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
            <soapenv:Header/>
            <soapenv:Body>
                <gxv:wsGestionAbonado.BUSCARABONADOV2>
                    <gxv:Entrada>${JSON.stringify(jsonInput)}</gxv:Entrada>
                </gxv:wsGestionAbonado.BUSCARABONADOV2>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Envía la solicitud SOAP
        const response = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest175/servlet/awsgestionabonado', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml'
            }
        });

        // Procesa la respuesta SOAP
        const xmlResponse = response.data;
        console.log('SOAP Response:', xmlResponse);

        // Convierte XML a JSON
        xml2js.parseString(xmlResponse, { explicitArray: false, mergeAttrs: true, xmlns: true }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Error parsing XML response' });
            }

            // Imprime el resultado completo para depuración
            console.log('Parsed XML:', result);

            // Verifica si la estructura del resultado es la esperada
            if (!result['SOAP-ENV:Envelope'] || !result['SOAP-ENV:Envelope']['SOAP-ENV:Body']) {
                console.error('Unexpected XML structure:', result);
                return res.status(500).json({ error: 'Unexpected XML structure' });
            }

            // Extrae el contenido de <Salida> y desescapa las entidades HTML
            const salida = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsGestionAbonado.BUSCARABONADOV2Response']['Salida'];
            const decodedSalida = he.decode(salida); // Desescapa las entidades HTML

            try {
                // Convierte el contenido de <Salida> a JSON
                const jsonResponse = JSON.parse(decodedSalida);
                console.log('JSON Response:', jsonResponse);

                // Envía la respuesta JSON
                res.json(jsonResponse);
            } catch (jsonError) {
                console.error('Error parsing JSON from response:', jsonError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    } catch (error) {
        console.error('Error processing SOAP request:', error);
        res.status(500).json({ error: 'Error processing SOAP request' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
