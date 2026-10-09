import { randomBytes } from "node:crypto";
import { chmod, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const prompt = createInterface({ input: stdin, output: stdout });

function normalizeDomain(value) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

try {
  const domain = normalizeDomain(await prompt.question("Domínio ou hostname (ex.: risaverify.com.br ou 203.0.113.10.nip.io): "));
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    throw new Error("Domínio inválido. Informe apenas o nome, sem caminho ou protocolo.");
  }

  const defaultDoctors = "Dra. Laura Santos,Dr. Rafael Neto,Dr. Gustavo Medeiros,Dr. Omar Faria,Dr. Caio Mendes,Dr. Vinícius Prado,Dr. Fernando Costa,Dr. Theo Santos,Dr. Ana Rocha,Dr. Camila Lopes";
  const doctors = (await prompt.question(`Médicos disponíveis no upload [${defaultDoctors}]: `)).trim() || defaultDoctors;
  const doctorNames = doctors.split(",").map((name) => name.trim()).filter(Boolean);
  if (/[\r\n]/.test(doctors) || doctorNames.length === 0 || new Set(doctorNames).size !== doctorNames.length) {
    throw new Error("Informe uma lista de nomes únicos, separados por vírgulas.");
  }

  const portalPassword = randomBytes(24).toString("base64url");
  const uploadSecret = randomBytes(32).toString("base64url");
  const composeEnvironment = `RISA_DOMAIN=${domain}\n`;
  const runtimeEnvironment = [
    `RISA_DOMAIN=${domain}`,
    `NEXT_PUBLIC_APP_URL=https://${domain}`,
    `PORTAL_ACCESS_PASSWORD=${portalPassword}`,
    `PATIENT_UPLOAD_IDENTITY_SECRET=${uploadSecret}`,
    `PATIENT_UPLOAD_DOCTOR_NAMES=${doctorNames.join(",")}`,
    `PORTAL_UPLOADS_VISIBLE_AFTER=${new Date().toISOString()}`,
    "AWS_REGION=us-east-1",
    "AWS_S3_PREFIX=risa-verify",
    "",
  ].join("\n");

  await writeFile(".env.production", runtimeEnvironment, { mode: 0o600 });
  await chmod(".env.production", 0o600);

  console.log("\nConfiguração criada em .env.production com permissões restritas.");
  console.log("Usuário do portal médico: risa");
  console.log(`Senha única gerada para o portal: ${portalPassword}`);
  console.log("Guarde a senha em um gerenciador de senhas. Ela não será exibida novamente.");
  console.log("Não versione nem compartilhe esse arquivo. Confirme que .env.production não aparece no git status.");
} finally {
  prompt.close();
}