import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = (process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASSWORD no .env.",
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransporter;
}

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendMail({ to, subject, html, text }: SendMailInput) {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER!;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  });
}

export function renderResetPasswordEmail(opts: {
  name: string;
  code: string;
  expiresInMinutes: number;
}) {
  const { name, code, expiresInMinutes } = opts;
  const firstName = name?.split(" ")[0] ?? "tudo bem";

  const html = `
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#fbf7ee;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f1b16;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf7ee;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ece6d6;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <div style="font-size:14px;color:#8b7a5a;letter-spacing:0.08em;text-transform:uppercase;">Caixinha dos Noivos</div>
                <h1 style="margin:8px 0 0 0;font-size:24px;color:#1f1b16;">Redefinição de senha</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 8px 32px;font-size:15px;line-height:1.55;color:#3b352a;">
                Olá, ${firstName}! Recebemos um pedido para redefinir a senha da sua conta. Use o código abaixo para concluir a alteração:
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px;">
                <div style="display:inline-block;padding:18px 28px;border-radius:14px;background:#fbf2dc;border:1px solid #e8d6a5;font-family:'Courier New',monospace;font-size:32px;letter-spacing:12px;font-weight:700;color:#1f1b16;">
                  ${code}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;font-size:14px;line-height:1.55;color:#5b5240;">
                O código é válido por <strong>${expiresInMinutes} minutos</strong>. Se você não solicitou esta redefinição, ignore este e-mail — sua senha permanece a mesma.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;font-size:12px;color:#8b7a5a;border-top:1px solid #ece6d6;">
                Este e-mail foi enviado automaticamente por Caixinha dos Noivos. Em caso de dúvidas, responda esta mensagem.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `Olá, ${firstName}!\n\nRecebemos um pedido para redefinir a senha da sua conta na Caixinha dos Noivos.\n\nSeu código é: ${code}\n\nVálido por ${expiresInMinutes} minutos. Se você não solicitou, ignore este e-mail.`;

  return { html, text };
}
