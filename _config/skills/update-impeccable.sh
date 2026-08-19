#!/usr/bin/env bash
# Atualiza o Impeccable vendorizado em _config/skills/impeccable.
#
# Por que este script existe: `npx impeccable update` detecta que
# .claude/skills/impeccable é um symlink e se recusa a sobrescrever
# (ele espera um submódulo git). Então instalamos numa pasta temporária
# e trocamos os arquivos reais em _config, preservando o symlink.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "→ baixando última versão do Impeccable..."
(cd "$STAGE" && npx --yes impeccable@latest install --providers=claude --scope=project >/dev/null)

if [ ! -f "$STAGE/.claude/skills/impeccable/SKILL.md" ]; then
  echo "✗ install falhou: SKILL.md não encontrado em $STAGE" >&2
  exit 1
fi

echo "→ trocando arquivos em _config/skills/impeccable..."
rm -rf "$ROOT/_config/skills/impeccable"
cp -R "$STAGE/.claude/skills/impeccable" "$ROOT/_config/skills/impeccable"

# recria o symlink caso tenha sido perdido
mkdir -p "$ROOT/.claude/skills"
ln -sfn ../../_config/skills/impeccable "$ROOT/.claude/skills/impeccable"

# hooks (PostToolUse + Stop) — sobrescreve com a versão nova
cp "$STAGE/.claude/settings.local.json" "$ROOT/.claude/settings.local.json"

VER="$(sed -n 's/^version: //p' "$ROOT/_config/skills/impeccable/SKILL.md" | head -1)"
echo "✓ Impeccable v${VER} instalado em _config/skills/impeccable"
echo "  Reinicie o Claude Code para recarregar a skill."
