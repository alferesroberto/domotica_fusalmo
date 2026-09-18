export default async function handler(req, res) {
    // Permitir CORS para las peticiones locales y de producción
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key'
    );
  
    // Responder inmediatamente a la petición de verificación preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    const { path } = req.query; // Captura la ruta del dispositivo
    const endpoint = Array.isArray(path) ? path.join('/') : path || '';
  
    // Obtener la API Key guardada en las variables de entorno de Vercel
    const apiKey = process.env.VITE_SINRIC_API_KEY || process.env.SINRIC_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({ error: 'La API Key no está configurada en Vercel' });
    }
  
    try {
      const url = `https://api.sinric.pro/v1/${endpoint}`;
      const fetchOptions = {
        method: req.method,
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      };
  
      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
  
      const response = await fetch(url, fetchOptions);
      const data = await response.json();
  
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Error al comunicarse con Sinric Pro', details: error.message });
    }
  }