#!/usr/bin/env bash
# Apaga todas as caixinhas, doações, saques e usuários NÃO-admin do banco de produção.
# Preserva apenas usuários com role = 'ADMIN'.
# Também limpa os uploads (imagens/vídeos das doações) do bind mount.
#
# Uso (na VPS, como root ou usuário com sudo + acesso ao docker):
#   bash wipe-non-admin.sh
#
# O script é interativo: faz backup primeiro, mostra contagem do que vai apagar,
# pede confirmação digitando "APAGAR", executa em transação, e mostra contagem final.

set -euo pipefail

PG_CONTAINER="caixinha_postgres"
PG_USER="caixinha"
PG_DB="caixinha_dos_noivos"
UPLOADS_DIR="/var/caixinha/uploads"
BACKUP_DIR="/var/caixinha/backups"
TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/pre-wipe-${TS}.sql"

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow(){ printf '\033[33m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

bold "==> 1/5 Verificando container e backup"
if ! docker ps --format '{{.Names}}' | grep -qx "${PG_CONTAINER}"; then
  red "Container '${PG_CONTAINER}' não está rodando. Abortando."
  exit 1
fi

mkdir -p "${BACKUP_DIR}"
docker exec "${PG_CONTAINER}" pg_dump -U "${PG_USER}" -d "${PG_DB}" > "${BACKUP_FILE}"
green "Backup salvo em ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

bold "==> 2/5 Contagem ANTES (o que será apagado)"
docker exec -i "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${PG_DB}" <<'SQL'
SELECT
  (SELECT COUNT(*) FROM "User" WHERE role <> 'ADMIN')                                    AS users_to_delete,
  (SELECT COUNT(*) FROM "User" WHERE role  = 'ADMIN')                                    AS admins_to_keep,
  (SELECT COUNT(*) FROM "Caixinha"
     WHERE "userId" IN (SELECT id FROM "User" WHERE role <> 'ADMIN'))                    AS caixinhas_to_delete,
  (SELECT COUNT(*) FROM "Donation"
     WHERE "caixinhaId" IN (
       SELECT c.id FROM "Caixinha" c JOIN "User" u ON c."userId" = u.id
       WHERE u.role <> 'ADMIN'))                                                         AS donations_to_delete,
  (SELECT COUNT(*) FROM "Withdrawal"
     WHERE "userId" IN (SELECT id FROM "User" WHERE role <> 'ADMIN'))                    AS withdrawals_to_delete,
  (SELECT COUNT(*) FROM "PasswordReset"
     WHERE "userId" IN (SELECT id FROM "User" WHERE role <> 'ADMIN'))                    AS resets_to_delete;
SQL

echo
yellow "Esta ação é IRREVERSÍVEL (mas você tem o backup acima)."
read -r -p "Digite APAGAR (em maiúsculas) para confirmar: " confirm
if [ "${confirm}" != "APAGAR" ]; then
  red "Cancelado. Nada foi modificado."
  exit 0
fi

bold "==> 3/5 Executando DELETE em transação"
docker exec -i "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${PG_DB}" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;

DELETE FROM "Donation"
 WHERE "caixinhaId" IN (
   SELECT c.id FROM "Caixinha" c
   JOIN "User" u ON c."userId" = u.id
   WHERE u.role <> 'ADMIN'
 );

DELETE FROM "Withdrawal"
 WHERE "userId" IN (SELECT id FROM "User" WHERE role <> 'ADMIN');

DELETE FROM "Caixinha"
 WHERE "userId" IN (SELECT id FROM "User" WHERE role <> 'ADMIN');

-- PasswordReset tem ON DELETE CASCADE no userId, então some junto com o User,
-- mas deleto explicitamente para o resultado ficar claro nos counts finais.
DELETE FROM "PasswordReset"
 WHERE "userId" IN (SELECT id FROM "User" WHERE role <> 'ADMIN');

DELETE FROM "User" WHERE role <> 'ADMIN';

COMMIT;
SQL
green "DELETE aplicado."

bold "==> 4/5 Limpando uploads em ${UPLOADS_DIR}"
if [ -d "${UPLOADS_DIR}/images" ]; then
  find "${UPLOADS_DIR}/images" -type f -delete
  green "Imagens removidas."
fi
if [ -d "${UPLOADS_DIR}/videos" ]; then
  find "${UPLOADS_DIR}/videos" -type f -delete
  green "Vídeos removidos."
fi

bold "==> 5/5 Contagem DEPOIS"
docker exec -i "${PG_CONTAINER}" psql -U "${PG_USER}" -d "${PG_DB}" <<'SQL'
SELECT
  (SELECT COUNT(*) FROM "User")          AS users_remaining,
  (SELECT COUNT(*) FROM "Caixinha")      AS caixinhas_remaining,
  (SELECT COUNT(*) FROM "Donation")      AS donations_remaining,
  (SELECT COUNT(*) FROM "Withdrawal")    AS withdrawals_remaining,
  (SELECT COUNT(*) FROM "PasswordReset") AS resets_remaining;
SELECT id, email, name, role FROM "User";
SQL

green "Concluído. Backup: ${BACKUP_FILE}"
