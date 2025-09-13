// api/collect-web-vitals.js
// Función sencilla para Vercel. Guarda logs con console.log.
// No almacena en base de datos; para eso te muestro opciones abajo.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(200).send('OK');
    return;
  }

  try {
    // Intentamos usar req.body (Vercel suele parsearlo), si no, leemos raw
    let body = req.body;
    if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
      // leer cuerpo crudo
      let raw = '';
      await new Promise((resolve, reject) => {
        req.on('data', chunk => raw += chunk);
        req.on('end', resolve);
        req.on('error', reject);
      });
      body = raw ? JSON.parse(raw) : {};
    }

    // Logueamos la métrica — podrás verla en Vercel → Deploy → Logs
    console.log('[web-vitals] ', JSON.stringify(body));

    // Responder 204 (sin contenido)
    res.status(204).end();
  } catch (err) {
    console.error('[web-vitals][error] ', err);
    res.status(400).json({ error: 'invalid payload' });
  }
};
