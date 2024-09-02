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

            try {
                // Navega en la estructura XML
                const salidaElement = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsGestionAbonado.BUSCARABONADOV2Response']['Salida'];
                console.log("La salida es -------------------->", salidaElement);

                // Verifica el tipo de dato de <Salida>
                if (typeof salidaElement === 'object' && salidaElement._) {
                    console.log("============ Entro a la validacion de object con _===============");
                    
                    // Obtén el contenido JSON escapado del campo _
                    let escapedJsonString = salidaElement._;
                
                    // Desescapa las entidades HTML
                    const decodedSalida = he.decode(escapedJsonString);
                
                    // Reemplaza &quot; por comillas dobles "
                    const correctedJsonString = decodedSalida.replace(/&quot;/g, '"');
                
                    // Desescapa las barras invertidas dobles
                    const singleBackslashString = correctedJsonString.replace(/\\{2}/g, '\\');
                
                    // Convierte el contenido de <Salida> a JSON
                    try {
                        const jsonResponse = JSON.parse(singleBackslashString);
                
                        // Convierte el campo 'Abonados' de cadena JSON a objeto JSON
                        if (jsonResponse.Abonados) {
                            jsonResponse.Abonados = JSON.parse(jsonResponse.Abonados);
                        }
                
                        console.log('JSON Response:', jsonResponse);
                
                        // Envía la respuesta JSON
                        res.json(jsonResponse);
                    } catch (parseError) {
                        console.error('Error parsing JSON from response:', parseError);
                        res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
                    }
                } else if (salidaElement && typeof salidaElement === 'object' && salidaElement['$']) {
                    console.log("============ Entro a la validacion de object===============");
                    // Si es un objeto, convierte sus valores a una cadena JSON
                    const jsonResponse = JSON.stringify(salidaElement);
                    console.log('JSON Response:', jsonResponse);
                
                    // Envía la respuesta JSON
                    res.json(JSON.parse(jsonResponse));
                } else {
                    console.log("============ Entro al else por defecto===============");
                    throw new Error('Elemento <Salida> tiene un formato inesperado');
                }
                
                
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    } catch (error) {
        console.error('Error processing SOAP request:', error);
        res.status(500).json({ error: 'Error processing SOAP request' });
    }
});


app.post('/consultarestados', async (req, res) => {
    try {
        // Construye el XML Request
        const xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
            <soapenv:Header/>
            <soapenv:Body>
                <gxv:wsDireccion.Execute>
                    <gxv:Xmlsdt>{"Apikey" : "741D8F3B885FA8544795912C8F6B1045","Funcion" : "ESTADO"}</gxv:Xmlsdt>
                </gxv:wsDireccion.Execute>
            </soapenv:Body>
        </soapenv:Envelope>`;

        // Envía la solicitud SOAP
        const response = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest174/servlet/awsdireccion', xmlRequest, {
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

            try {
                // Navega en la estructura XML
                const responseElement = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsDireccion.ExecuteResponse'];
                const xmlsdtoutElement = responseElement['Xmlsdtout']['_']; // El JSON dentro de <Xmlsdtout>
                const coderror = responseElement['Coderror']['_'];
                const msgerr = responseElement['Msgerr']['_'];

                // Desescapa las entidades HTML
                const decodedXmlsdtout = he.decode(xmlsdtoutElement);

                // Convierte el contenido de <Xmlsdtout> a JSON
                const estadosArray = JSON.parse(decodedXmlsdtout);

                // Estructura la respuesta final en JSON
                const jsonResponse = {
                    estados: estadosArray,
                    coderror: coderror,
                    msgerr: msgerr
                };

                console.log('JSON Response:', jsonResponse);

                // Envía la respuesta JSON
                res.json(jsonResponse);
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    } catch (error) {
        console.error('Error processing SOAP request:', error);
        res.status(500).json({ error: 'Error processing SOAP request' });
    }
});


app.post('/consultarciudadsegunestado', async (req, res) => {

    try{
        const jsonInput = req.body;
        console.log("el request en json es ----->",JSON.stringify(jsonInput));
        const xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
                            <soapenv:Header/>
                            <soapenv:Body>
                                <gxv:wsDireccion.Execute>
                                    <gxv:Xmlsdt>${JSON.stringify(jsonInput)}</gxv:Xmlsdt>
                                </gxv:wsDireccion.Execute>
                            </soapenv:Body>
                            </soapenv:Envelope>`;
           
        // Envía la solicitud SOAP
        const response = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest174/servlet/awsdireccion', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml'
            }
        });   

        // Procesa la respuesta SOAP
        const xmlResponse = response.data;
        console.log('SOAP Response:', xmlResponse);

        xml2js.parseString(xmlResponse, { explicitArray: false, mergeAttrs: true, xmlns: true }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Error parsing XML response' });
            }

            try {
                // Navega en la estructura XML
                const responseElement = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsDireccion.ExecuteResponse'];
                const xmlsdtoutElement = responseElement['Xmlsdtout']['_']; // El JSON dentro de <Xmlsdtout>
                const coderror = responseElement['Coderror']['_'];
                const msgerr = responseElement['Msgerr']['_'];

                // Desescapa las entidades HTML
                const decodedXmlsdtout = he.decode(xmlsdtoutElement);

                // Convierte el contenido de <Xmlsdtout> a JSON
                const ciudadesArray = JSON.parse(decodedXmlsdtout);

                // Estructura la respuesta final en JSON
                const jsonResponse = {
                    ciudades: ciudadesArray,
                    coderror: coderror,
                    msgerr: msgerr
                };

                console.log('JSON Response:', jsonResponse);

                // Envía la respuesta JSON
                res.json(jsonResponse);
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    }
    catch (error) {

    }

});


app.post('/consultarmunicipiosegunciudad', async (req, res) => {

    try{
        const jsonInput = req.body;
        console.log("el request en json es ----->",JSON.stringify(jsonInput));
        const xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
                            <soapenv:Header/>
                            <soapenv:Body>
                                <gxv:wsDireccion.Execute>
                                    <gxv:Xmlsdt>${JSON.stringify(jsonInput)}</gxv:Xmlsdt>
                                </gxv:wsDireccion.Execute>
                            </soapenv:Body>
                            </soapenv:Envelope>`;
           
        // Envía la solicitud SOAP
        const response = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest174/servlet/awsdireccion', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml'
            }
        });   

        // Procesa la respuesta SOAP
        const xmlResponse = response.data;
        console.log('SOAP Response:', xmlResponse);

        xml2js.parseString(xmlResponse, { explicitArray: false, mergeAttrs: true, xmlns: true }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Error parsing XML response' });
            }

            try {
                // Navega en la estructura XML
                const responseElement = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsDireccion.ExecuteResponse'];
                const xmlsdtoutElement = responseElement['Xmlsdtout']['_']; // El JSON dentro de <Xmlsdtout>
                const coderror = responseElement['Coderror']['_'];
                const msgerr = responseElement['Msgerr']['_'];

                // Desescapa las entidades HTML
                const decodedXmlsdtout = he.decode(xmlsdtoutElement);

                // Convierte el contenido de <Xmlsdtout> a JSON
                const municipiosArray = JSON.parse(decodedXmlsdtout);

                // Estructura la respuesta final en JSON
                const jsonResponse = {
                    municipios: municipiosArray,
                    coderror: coderror,
                    msgerr: msgerr
                };

                console.log('JSON Response:', jsonResponse);

                // Envía la respuesta JSON
                res.json(jsonResponse);
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    }
    catch (error) {

    }

});


app.post('/consultarsectorsegunmunicipio', async (req, res) => {

    try{
        const jsonInput = req.body;
        console.log("el request en json es ----->",JSON.stringify(jsonInput));
        const xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
                            <soapenv:Header/>
                            <soapenv:Body>
                                <gxv:wsDireccion.Execute>
                                    <gxv:Xmlsdt>${JSON.stringify(jsonInput)}</gxv:Xmlsdt>
                                </gxv:wsDireccion.Execute>
                            </soapenv:Body>
                            </soapenv:Envelope>`;
           
        // Envía la solicitud SOAP
        const response = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest174/servlet/awsdireccion', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml'
            }
        });   

        // Procesa la respuesta SOAP
        const xmlResponse = response.data;
        console.log('SOAP Response:', xmlResponse);

        xml2js.parseString(xmlResponse, { explicitArray: false, mergeAttrs: true, xmlns: true }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Error parsing XML response' });
            }

            try {
                // Navega en la estructura XML
                const responseElement = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsDireccion.ExecuteResponse'];
                const xmlsdtoutElement = responseElement['Xmlsdtout']['_']; // El JSON dentro de <Xmlsdtout>
                const coderror = responseElement['Coderror']['_'];
                const msgerr = responseElement['Msgerr']['_'];

                // Desescapa las entidades HTML
                const decodedXmlsdtout = he.decode(xmlsdtoutElement);

                // Convierte el contenido de <Xmlsdtout> a JSON
                const sectoresArray = JSON.parse(decodedXmlsdtout);

                // Estructura la respuesta final en JSON
                const jsonResponse = {
                    sectores: sectoresArray,
                    coderror: coderror,
                    msgerr: msgerr
                };

                console.log('JSON Response:', jsonResponse);

                // Envía la respuesta JSON
                res.json(jsonResponse);
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    }
    catch (error) {

    }

});


app.post('/consultarurbanizacionsegunsector', async (req, res) => {

    try{
        const jsonInput = req.body;
        console.log("el request en json es ----->",JSON.stringify(jsonInput));
        const xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
                            <soapenv:Header/>
                            <soapenv:Body>
                                <gxv:wsDireccion.Execute>
                                    <gxv:Xmlsdt>${JSON.stringify(jsonInput)}</gxv:Xmlsdt>
                                </gxv:wsDireccion.Execute>
                            </soapenv:Body>
                            </soapenv:Envelope>`;
           
        // Envía la solicitud SOAP
        const response = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest174/servlet/awsdireccion', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml'
            }
        });   

        // Procesa la respuesta SOAP
        const xmlResponse = response.data;
        console.log('SOAP Response:', xmlResponse);

        xml2js.parseString(xmlResponse, { explicitArray: false, mergeAttrs: true, xmlns: true }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Error parsing XML response' });
            }

            try {
                // Navega en la estructura XML
                const responseElement = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsDireccion.ExecuteResponse'];
                const xmlsdtoutElement = responseElement['Xmlsdtout']['_']; // El JSON dentro de <Xmlsdtout>
                const coderror = responseElement['Coderror']['_'];
                const msgerr = responseElement['Msgerr']['_'];

                // Desescapa las entidades HTML
                const decodedXmlsdtout = he.decode(xmlsdtoutElement);

                // Convierte el contenido de <Xmlsdtout> a JSON
                const urbanizacionesArray = JSON.parse(decodedXmlsdtout);

                // Estructura la respuesta final en JSON
                const jsonResponse = {
                    urbanizaciones: urbanizacionesArray,
                    coderror: coderror,
                    msgerr: msgerr
                };

                console.log('JSON Response:', jsonResponse);

                // Envía la respuesta JSON
                res.json(jsonResponse);
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    }
    catch (error) {

    }

});


app.post('/consultardireccionessegunurbanizacion', async (req, res) => {

    try{
        const jsonInput = req.body;
        console.log("el request en json es ----->",JSON.stringify(jsonInput));
        const xmlRequest = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:gxv="GxVisionX_K2BTools">
                            <soapenv:Header/>
                            <soapenv:Body>
                                <gxv:wsDireccion.Execute>
                                    <gxv:Xmlsdt>${JSON.stringify(jsonInput)}</gxv:Xmlsdt>
                                </gxv:wsDireccion.Execute>
                            </soapenv:Body>
                            </soapenv:Envelope>`;
           
        // Envía la solicitud SOAP
        const response = await axios.post('http://200.8.126.162:8080/GxVisionX_K2BToolsJavaEnvironment_GxTest174/servlet/awsdireccion', xmlRequest, {
            headers: {
                'Content-Type': 'text/xml'
            }
        });   

        // Procesa la respuesta SOAP
        const xmlResponse = response.data;
        console.log('SOAP Response:', xmlResponse);

        xml2js.parseString(xmlResponse, { explicitArray: false, mergeAttrs: true, xmlns: true }, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return res.status(500).json({ error: 'Error parsing XML response' });
            }

            try {
                // Navega en la estructura XML
                const responseElement = result['SOAP-ENV:Envelope']['SOAP-ENV:Body']['wsDireccion.ExecuteResponse'];
                const xmlsdtoutElement = responseElement['Xmlsdtout']['_']; // El JSON dentro de <Xmlsdtout>
                const coderror = responseElement['Coderror']['_'];
                const msgerr = responseElement['Msgerr']['_'];

                // Desescapa las entidades HTML
                const decodedXmlsdtout = he.decode(xmlsdtoutElement);

                // Convierte el contenido de <Xmlsdtout> a JSON
                const direccionesArray = JSON.parse(decodedXmlsdtout);

                // Estructura la respuesta final en JSON
                const jsonResponse = {
                    direcciones: direccionesArray,
                    coderror: coderror,
                    msgerr: msgerr
                };

                console.log('JSON Response:', jsonResponse);

                // Envía la respuesta JSON
                res.json(jsonResponse);
            } catch (parseError) {
                console.error('Error parsing JSON from response:', parseError);
                res.status(500).json({ error: 'Error parsing JSON from SOAP response' });
            }
        });
    }
    catch (error) {

    }
console.log("testinggggg")
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
