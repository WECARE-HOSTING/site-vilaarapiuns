#!/usr/bin/env bash
# Atualiza as 12 skills e os 3 subagents vendorizados de JuliusBrussee/caveman.
#
# Só entra aqui o que roda sem conta: as 8 skills que dependem de Caveman Cloud,
# do binário Go ou do hook do plugin ficam de fora de propósito — ver ORIGEM.md.
#
# Diferente do update-taste-skill.sh, aqui pasta == `name:` em toda skill da
# origem, então não há mapeamento a fazer. A verificação continua existindo como
# canário: se o upstream renomear uma skill, o Claude Code passaria a ignorá-la
# em silêncio, e é melhor parar aqui.
#
# O CLI/proxy (`npm i -g @caveman-ai/cli`) NÃO é instalado por este script e não
# tem nada a ver com ele: é ferramenta global de máquina, aponta o
# ANTHROPIC_BASE_URL do Claude Code para um proxy local e roda sobre binários Go
# BSL-1.1. Decisão separada, tomada fora do repo.
set -euo pipefail

REPO="https://github.com/JuliusBrussee/caveman.git"
REF="${CAVEMAN_REF:-}"   # exporte CAVEMAN_REF=v2.2.0 para fixar uma tag
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

SKILLS=(
  # saída comprimida — o produto original, MIT, sem dependência
  caveman
  caveman-commit
  caveman-review
  # delegação
  caveman-explore
  cavecrew
  # compressão de arquivo de memória (traz scripts Python)
  caveman-compress
  # workflow genérico — sobrepõem as superpowers, ver aviso no ORIGEM.md
  investigate-first
  lean-build
  migration
  safe-refactor
  surgical-patch
  verify-and-stop
)

# a skill cavecrew só faz sentido com estes três instalados
AGENTS=(
  cavecrew-investigator
  cavecrew-builder
  cavecrew-reviewer
)

echo "→ clonando $REPO${REF:+ @ $REF}..."
if [ -n "$REF" ]; then
  git clone --quiet --depth 1 --branch "$REF" "$REPO" "$STAGE/caveman"
else
  git clone --quiet --depth 1 "$REPO" "$STAGE/caveman"
fi
COMMIT="$(git -C "$STAGE/caveman" rev-parse HEAD)"

mkdir -p "$ROOT/_config/agents" "$ROOT/.claude/agents" "$ROOT/.claude/skills"

for name in "${SKILLS[@]}"; do
  file="$STAGE/caveman/skills/$name/SKILL.md"
  [ -f "$file" ] || { echo "✗ skills/$name/SKILL.md não existe mais na origem" >&2; exit 1; }
  # canário: pasta != name: faz o Claude Code ignorar a skill sem avisar
  declared="$(sed -n 's/^name: *//p' "$file" | head -1)"
  [ "$declared" = "$name" ] || { echo "✗ skills/$name declara name: $declared" >&2; exit 1; }
  rm -rf "$ROOT/_config/skills/$name"
  cp -R "$STAGE/caveman/skills/$name" "$ROOT/_config/skills/$name"
  ln -sfn "../../_config/skills/$name" "$ROOT/.claude/skills/$name"
  echo "  ✓ skill $name"
done

for name in "${AGENTS[@]}"; do
  file="$STAGE/caveman/agents/$name.md"
  [ -f "$file" ] || { echo "✗ agents/$name.md não existe mais na origem" >&2; exit 1; }
  declared="$(sed -n 's/^name: *//p' "$file" | head -1)"
  [ "$declared" = "$name" ] || { echo "✗ agents/$name.md declara name: $declared" >&2; exit 1; }
  cp "$file" "$ROOT/_config/agents/$name.md"
  ln -sfn "../../_config/agents/$name.md" "$ROOT/.claude/agents/$name.md"
  echo "  ✓ agent $name"
done

cp "$STAGE/caveman/LICENSE" "$ROOT/_config/skills/LICENSE-caveman"

echo "✓ ${#SKILLS[@]} skills e ${#AGENTS[@]} subagents do commit ${COMMIT:0:12}"
echo "  Anote o commit no ORIGEM.md e reinicie o Claude Code para recarregar."
