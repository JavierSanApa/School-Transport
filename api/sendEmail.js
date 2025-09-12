// /api/sendEmail.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://school-transport-ae17e.web.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // respuesta preflight
  }

  if (req.method === "POST") {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
      });

      return res.status(200).json({ success: true, id: info.messageId });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al enviar el correo" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}
