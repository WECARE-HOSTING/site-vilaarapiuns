#!/usr/bin/env bash
# Atualiza as 13 skills vendorizadas de leonxlnx/taste-skill.
#
# Por que este script existe: no repo de origem o nome da pasta quase nunca é o
# `name:` do frontmatter (skills/soft-skill declara high-end-visual-design), e o
# Claude Code exige pasta == name: para carregar a skill. O mapeamento abaixo faz
# essa tradução — é o mesmo nome que o instalador oficial usaria. E o instalador
# oficial (`npx skills add leonxlnx/taste-skill`) escreve direto em
# .claude/skills/, o que quebraria a convenção de symlink do ORIGEM.md.
set -euo pipefail

REPO="https://github.com/leonxlnx/taste-skill.git"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# pasta na origem : nome instalado (= `name:` do frontmatter)
MAP=(
  "brandkit:brandkit"
  "brutalist-skill:industrial-brutalist-ui"
  "gpt-tasteskill:gpt-taste"
  "image-to-code-skill:image-to-code"
  "imagegen-frontend-mobile:imagegen-frontend-mobile"
  "imagegen-frontend-web:imagegen-frontend-web"
  "minimalist-skill:minimalist-ui"
  "output-skill:full-output-enforcement"
  "redesign-skill:redesign-existing-projects"
  "soft-skill:high-end-visual-design"
  "stitch-skill:stitch-design-taste"
  "taste-skill:design-taste-frontend"
  "taste-skill-v1:design-taste-frontend-v1"
)

echo "→ clonando $REPO..."
git clone --quiet --depth 1 "$REPO" "$STAGE/taste-skill"
COMMIT="$(git -C "$STAGE/taste-skill" rev-parse HEAD)"

for pair in "${MAP[@]}"; do
  src="${pair%%:*}"; dst="${pair##*:}"
  file="$STAGE/taste-skill/skills/$src/SKILL.md"
  [ -f "$file" ] || { echo "✗ $src/SKILL.md não existe mais na origem" >&2; exit 1; }
  # se o upstream renomear a skill, para aqui em vez de instalar pasta quebrada
  name="$(sed -n 's/^name: *//p' "$file" | head -1)"
  [ "$name" = "$dst" ] || { echo "✗ $src declara name: $name, o mapeamento espera $dst" >&2; exit 1; }
  rm -rf "$ROOT/_config/skills/$dst"
  cp -R "$STAGE/taste-skill/skills/$src" "$ROOT/_config/skills/$dst"
  ln -sfn "../../_config/skills/$dst" "$ROOT/.claude/skills/$dst"
  echo "  ✓ $src → $dst"
done

cp "$STAGE/taste-skill/LICENSE" "$ROOT/_config/skills/LICENSE-taste-skill"

echo "✓ 13 skills instaladas do commit ${COMMIT:0:12}"
echo "  Anote o commit no ORIGEM.md e reinicie o Claude Code para recarregar."
