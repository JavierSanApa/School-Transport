const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://school-transport-ae17e.web.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { to, subject, text } = req.body;
    if (!to || !subject || !text) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2>${subject}</h2>
              <p>${text}</p>
            </div>`
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return res.status(500).json({ error: 'Error al enviar el correo', details: error.message });
  }
};
