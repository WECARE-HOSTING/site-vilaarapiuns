# Origem das skills vendorizadas

As skills aqui não são escritas neste projeto — são vendorizadas de fora e
versionadas junto com o site para que qualquer clone do repo já venha com elas.
`.claude/skills/<nome>` é sempre um symlink para `_config/skills/<nome>`.

## impeccable
Instalada via `npx impeccable@latest install`. Atualize com `./update-impeccable.sh`
(o npx se recusa a sobrescrever o symlink; o script contorna isso).

## emilkowalski/skills — 12 skills
https://github.com/emilkowalski/skills — MIT, Emil Kowalski.
Vendorizadas em 2026-08-22 do commit `d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7`.

animate, animate-expo, animation-vocabulary, apple-design, ask-sonner,
emil-design-eng, find-animation-opportunities, improve-animations,
pick-ui-library, prototype, review-animations, write-swift

Para atualizar: clonar o repo, copiar `skills/*` sobre `_config/skills/` e
recriar os symlinks. O instalador oficial (`npx skills@latest add
emilkowalski/skills`) escreve direto em `.claude/skills/` e quebraria a
convenção de symlink acima — não use.

`animate-expo` (React Native) e `write-swift` não têm uso neste site Astro;
ficam só porque o conjunto foi instalado inteiro.

## playwright-cli
Instalada via `npm install -g @playwright/cli@latest` + `playwright-cli install --skills`,
em 2026-08-22 (CLI 0.1.18). O instalador escreve um diretório real em
`.claude/skills/playwright-cli`; foi movido para `_config/skills/` e religado por
symlink para manter a convenção acima. Ao atualizar a CLI, rode o
`install --skills` de novo e repita o move + symlink.

Complementa o MCP `playwright` (`npx @playwright/mcp@latest`, registrado no
`.mcp.json`): a CLI custa menos contexto por ação, o MCP é o caminho padrão de
tool-call. A CLI achou o Chrome do sistema e usa ele como browser padrão.

## leonxlnx/taste-skill — 13 skills
https://github.com/leonxlnx/taste-skill — MIT, Leonxlnx (texto completo em
`LICENSE-taste-skill`, já que o `skills/` foi separado do repo de origem).
Vendorizadas em 2026-08-22 do commit `843c8dd4d18ccff0d5a9cd4b0b71d7dbf7278293`.

Atualize com `./update-taste-skill.sh`. Não use `npx skills add
leonxlnx/taste-skill`: escreve direto em `.claude/skills/` e quebraria a
convenção de symlink acima.

O nome da pasta na origem quase nunca é o `name:` do frontmatter, e o Claude Code
só carrega a skill se pasta e `name:` forem iguais — então a pasta instalada usa o
`name:`, que é também o nome pelo qual a skill é invocada:

| origem | instalado aqui |
| --- | --- |
| `taste-skill` | `design-taste-frontend` |
| `taste-skill-v1` | `design-taste-frontend-v1` |
| `soft-skill` | `high-end-visual-design` |
| `minimalist-skill` | `minimalist-ui` |
| `brutalist-skill` | `industrial-brutalist-ui` |
| `redesign-skill` | `redesign-existing-projects` |
| `stitch-skill` | `stitch-design-taste` |
| `output-skill` | `full-output-enforcement` |
| `image-to-code-skill` | `image-to-code` |
| `gpt-tasteskill` | `gpt-taste` |
| `brandkit`, `imagegen-frontend-web`, `imagegen-frontend-mobile` | mesmo nome |

O `update-taste-skill.sh` aborta se o upstream mudar um `name:` — melhor parar do
que instalar pasta que o Claude Code ignora em silêncio.

O conjunto foi instalado inteiro, mas boa parte não serve a este site:
`gpt-taste` é escrito para GPT/Codex, `stitch-design-taste` gera `DESIGN.md` para
o Google Stitch, `imagegen-frontend-mobile` é app nativo, `design-taste-frontend-v1`
existe só para compatibilidade com a v1. As de geração de imagem
(`imagegen-frontend-web`, `brandkit`) dependem de um gerador externo — aqui isso
seria o MCP do Higgsfield.

Aviso de sobreposição: `design-taste-frontend`, `high-end-visual-design`,
`minimalist-ui` e `redesign-existing-projects` prescrevem linguagem visual, e o
projeto já tem `impeccable`, `frontend-design` e as 12 do Emil fazendo isso. As
regras não são compatíveis entre si (a taste-skill proíbe travessão e emoji, pede
GSAP e alta variância de layout) nem necessariamente com a paleta areia e mar já
decidida. Invoque uma por vez e com intenção, não as três juntas.

## JuliusBrussee/caveman — 12 skills + 3 subagents
https://github.com/JuliusBrussee/caveman — MIT (texto em `LICENSE-caveman`).
Vendorizadas em 2026-08-22 do commit `2f49f0e1a352aa810e70056b7930aeb0b3d219b4`.

Atualize com `./update-caveman.sh` (`CAVEMAN_REF=v2.2.0 ./update-caveman.sh` fixa
uma tag). Não use `npx skills add JuliusBrussee/caveman` nem
`claude plugin install caveman@caveman`: escrevem direto em `.claude/` e
quebrariam a convenção de symlink deste arquivo.

Aqui pasta == `name:` em toda skill da origem, então não há o mapeamento que o
`update-taste-skill.sh` precisa fazer. O script confere assim mesmo, como
canário para um rename futuro.

**Primeira entrada de subagent no projeto.** A convenção de symlink foi
estendida: `_config/agents/<nome>.md` é o arquivo real, `.claude/agents/<nome>.md`
é o symlink. Os três `cavecrew-*` existem só para a skill `cavecrew` ter o que
invocar — sozinha ela não faz nada.

### O que entrou

| grupo | skills |
| --- | --- |
| saída comprimida (o produto original) | `caveman`, `caveman-commit`, `caveman-review` |
| delegação | `caveman-explore`, `cavecrew` (+ os 3 subagents) |
| compressão de arquivo de memória | `caveman-compress` |
| workflow genérico | `investigate-first`, `lean-build`, `migration`, `safe-refactor`, `surgical-patch`, `verify-and-stop` |

Cópia verbatim das pastas da origem, incluindo o scaffolding de CI do upstream
(`caveman-explore/package.json` e `tests/`, `agents/openai.yaml` nas genéricas).
Fica assim para o diff contra o upstream sair limpo na próxima atualização.

### O que ficou de fora, e por quê

As outras 8 skills da origem exigem infra que este projeto não tem e não vai ter:
`caveman-setup`, `caveman-discover`, `caveman-evidence-review`, `caveman-manage`
e `caveman-optimize` querem conta no Caveman Cloud, gateway e Cave API key;
`caveman-learn` quer o binário Go; `caveman-stats` só produz número se o hook
`mode-tracker` do plugin estiver instalado; `caveman-help` é cartão de referência
do install completo. Instaladas, apareceriam no menu de skills e falhariam na hora
de usar.

**O CLI/proxy também ficou de fora, e isso foi decisão, não esquecimento.**
`npm i -g @caveman-ai/cli` é o outro produto do repo: instala global na máquina,
baixa binários Go sob BSL-1.1 (`engine/`, `proxy/`, `mcp/`, `shrink/`,
`cacheengine/`) de releases do GitHub, aponta o `ANTHROPIC_BASE_URL` do Claude
Code para um proxy local — se o proxy não estiver de pé, as requisições não
roteiam em vez de passarem direto — e manda telemetria para
`api.caveman.so/telemetry/cli` (respeita `DO_NOT_TRACK` e `CAVEMAN_TELEMETRY`).
Nada disso pertence a um repo de site Astro. Se um dia for instalado, é fora
daqui e vale para toda a máquina, não só para este projeto.

### Aviso de sobreposição

As 6 genéricas de workflow batem de frente com as superpowers que já rodam na
sessão: `investigate-first` vs `systematic-debugging`, `verify-and-stop` vs
`verification-before-completion`, `surgical-patch` e `safe-refactor` vs
`test-driven-development`. São curtas (~700 bytes) e mais frouxas que as
superpowers, que são explicitamente rígidas. Mesmo aviso das taste-skills:
invoque uma por vez e com intenção.

A skill `caveman` preserva o idioma de quem escreve por regra explícita no corpo
dela ("Preserve user's dominant language exactly") — comprime o estilo, não
troca para inglês. Trabalho em PT continua em PT.

## diegosouzapw/OmniRoute — 45 skills
https://github.com/diegosouzapw/OmniRoute — MIT (texto em `LICENSE-omniroute`).
Vendorizadas em 2026-08-22 do commit `c68cda7dfb49f5741195b7398e4cc6349a6d07f2`
(branch `main`).

Atualize com `./update-omniroute.sh` (`OMNIROUTE_REF=v3.8.50 ./update-omniroute.sh`
fixa uma tag). Pasta == `name:` nas 45; o script confere assim mesmo, como canário
para um rename futuro, igual ao do caveman.

O script fixa `main` de propósito. O branch default do repo é a release da vez
(`release/v3.8.50` hoje) e nem sempre bate: a v3.8.50 traz uma skill `ponytail`
que não existe em `main`. `main` é o que os raw URLs do próprio README apontam.

### O que são

45 arquivos `SKILL.md`, um por pasta, 292 KB no total, sem scaffolding nenhum.
Não são skills de trabalho: são referência auto-gerada (`<!-- generated by
src/lib/agentSkills/generator.ts -->`) da API REST e do CLI do gateway OmniRoute —
endpoints em `localhost:20128`, comandos `omniroute …`. 22 de API, 21 de CLI mais
`config-codex-cli` e `omni-github-skills`, que a tabela do README de origem
esquece de listar (o mesmo README fala em "42-skill catalog" em outro trecho — a
contagem da origem é inconsistente; a daqui é a do diretório).

Como o conjunto inteiro veio, a poda é automática: o script reconhece o que veio
daqui pelo comentário do gerador e remove o que sumir da origem, junto com o
symlink. Não há lista fixa a manter como no `update-caveman.sh`.

### O gateway NÃO foi instalado, e isso foi decisão

`npm i -g omniroute` sobe um servidor em `localhost:20128` e repontua o cliente
para ele. É o mesmo caso do CLI/proxy do caveman documentado acima: ferramenta
global de máquina, não pertence a um repo de site Astro; se um dia for instalado,
é fora daqui.

Consequência direta, e é o ponto todo desta seção: **sem o gateway de pé,
nenhuma das 45 faz nada.** Todas apareceram no menu de skills e todas vão falhar
na hora de usar — exatamente o critério pelo qual as 8 skills de Caveman Cloud
ficaram de fora. Aqui a escolha foi outra porque o conjunto é indivisível
(não há subconjunto que funcione sem servidor) e porque vendorizar agora deixa
tudo pronto caso o gateway seja instalado depois. Enquanto não for, são 45 linhas
de ruído no menu.

### Aviso: duas delas quebram a convenção deste arquivo

`cli-skill-collector` e `omni-github-skills` procuram skills no GitHub e as
instalam sozinhas — e o destino que o `cli-skill-collector` documenta para o
Claude Code é `~/.claude/skills/{category}/`. Isso é a home do usuário, fora do
repo, e escreve diretório real onde este projeto usa symlink para `_config/`.
Mesmo veto que já vale para `npx skills add` e `claude plugin install`: não use
nenhuma das duas para instalar coisa alguma neste projeto. Para ler o que a
origem oferece, tudo bem.

### Aviso de sobreposição

`omni-compression`, `cli-compression` e `omni-context-rtk` falam de "Caveman"
como modo de compressão do gateway. Não é a mesma coisa que as skills `caveman*`
vendorizadas acima: aquelas comprimem a saída do Claude Code e não dependem de
servidor nenhum, estas configuram um filtro dentro do OmniRoute. Nomes iguais,
mecanismos diferentes.
