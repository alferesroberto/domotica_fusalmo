export default async function handler(req, res) {
    // Configuración de cabeceras CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key'
    );
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    // Obtener la ruta enviada en la query
    const { path } = req.query;
    const endpoint = Array.isArray(path) ? path.join('/') : path || '';
  
    // API Key cargada desde Vercel
    const apiKey = process.env.VITE_SINRIC_API_KEY || process.env.SINRIC_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({ error: 'La API Key no está configurada en las variables de entorno de Vercel' });
    }
  
    try {
      // Construcción de la URL de Sinric Pro
      const targetUrl = `https://api.sinric.pro/v1/${endpoint}`;
  
      const fetchOptions = {
        method: req.method,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Evita bloqueos por User-Agent vacío
        },
      };
  
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
  
      const response = await fetch(targetUrl, fetchOptions);
      const responseText = await response.text();
  
      // Intentar convertir la respuesta a JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Si Sinric Pro devuelve HTML o texto plano, devolverlo en el detalle para diagnosticar
        return res.status(response.status).json({
          error: `Sinric Pro respondió con estado HTTP ${response.status} (no JSON)`,
          rawResponse: responseText
        });
      }
  
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Error interno en la Serverless Function', details: error.message });
    }
  }