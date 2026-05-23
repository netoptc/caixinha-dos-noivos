import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 6;
const MAX_ATTEMPTS = 16;

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/**
 * Generates a 6-character alphanumeric code unique within the Caixinha table.
 * Retries on collision; throws if no unique code is found within MAX_ATTEMPTS.
 */
export async function generateUniqueCaixinhaCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateCode();
    const exists = await prisma.caixinha.findUnique({
      where: { slug: code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error(
    `Não foi possível gerar um código único após ${MAX_ATTEMPTS} tentativas.`
  );
}
