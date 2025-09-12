const nodemailer = require('nodemailer');
const Cors = require('cors');

// Configuración de CORS
const cors = Cors({
  origin: [
    'https://school-transport.web.app',
    'https://school-transport-ae17e.web.app',
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5002'
  ],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

// Función para ejecutar el middleware de CORS
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Configuración del transporte de correo
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

module.exports = async (req, res) => {
  // Ejecutar middleware de CORS
  await runMiddleware(req, res, cors);

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { to, subject, text } = req.body;

    // Validar campos requeridos
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Faltan campos requeridos (to, subject, text)' });
    }

    // Crear transporte de correo
    const transporter = createTransporter();

    // Enviar correo
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #4a4a4a;">${subject}</h2>
              <p style="color: #666; line-height: 1.5;">${text}</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="color: #999; font-size: 12px;">Este es un mensaje automático de CODI Transport. Por favor, no responda a este correo.</p>
              </div>
            </div>`
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return res.status(500).json({ error: 'Error al enviar el correo', details: error.message });
  }
};