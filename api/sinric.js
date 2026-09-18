export default async function handler(req, res) {
    // Configuración de cabeceras CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, x-sinric-api-key'
    );
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    // Capturar el path limpiando posibles caracteres o query params
    const { path } = req.query;
    let endpoint = '';
  
    if (Array.isArray(path)) {
      endpoint = path.join('/');
    } else if (typeof path === 'string') {
      endpoint = path;
    }
  
    // Limpiar cualquier caracter no deseado o corchete al final
    endpoint = endpoint.replace(/[\]\[]/g, '').trim();
  
    // Obtener la API Key desde Vercel
    const apiKey = process.env.VITE_SINRIC_API_KEY || process.env.SINRIC_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({ error: 'La API Key no está configurada en las variables de entorno de Vercel' });
    }
  
    try {
      // URL limpia de Sinric Pro API v1
      const targetUrl = `https://api.sinric.pro/api/v1/${endpoint}`;
  
      const fetchOptions = {
        method: req.method,
        headers: {
          'x-sinric-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      };
  
      // Procesar el cuerpo (body) de las peticiones POST / PUT
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        let payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  
        // Transformación automática para evitar el error 422 en Sinric Pro:
        // Sinric Pro requiere que las peticiones de acción tengan type: "request"
        // y que "value" sea una cadena JSON (JSON stringified).
        if (endpoint.includes('/action')) {
          const actionType = payload.action || 'setPowerState';
          const rawValue = payload.value || {};
  
          payload = {
            type: 'request',
            action: actionType,
            value: typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue,
          };
        }
  
        fetchOptions.body = JSON.stringify(payload);
      }
  
      // Realizar la Petición a Sinric Pro
      const response = await fetch(targetUrl, fetchOptions);
      const responseText = await response.text();
  
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        return res.status(response.status).json({
          error: `Sinric Pro respondió con HTTP ${response.status}`,
          rawResponse: responseText,
        });
      }
  
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Error interno en la Serverless Function', details: error.message });
    }
  }