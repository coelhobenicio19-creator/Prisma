# Política de Evidência: Editais, Questões, Fontes e Produção — PRISMA

## Princípio Fundamental

**Toda afirmação acadêmica no PRISMA deve ser rastreável a uma fonte verificável.**  
Nenhum dado é "oficial" sem evidência; nada é inventado como se fosse real.

---

## 1. Classificação de Fontes

| Classificação | Critério | Exemplos | Confiabilidade |
|---------------|----------|----------|----------------|
| **Oficial** | Órgão responsável + domínio/URL institucional legítimo + data de publicação + hash do documento | Edital Cebraspe PDF no site .gov.br; Diário Oficial; site da banca | Alta (verificada) |
| **Fornecido pelo Usuário** | Arquivo importado manualmente sem verificação de domínio oficial | PDF salvo do email; foto de edital; arquivo do Drive | Média (requer confirmação) |
| **Web Autorizada** | URL de domínio conhecido + data de acesso + hash | Wikipedia (referenciado), sites .edu/.gov, portais oficiais | Média-Alta (verificável) |
| **Gerada por IA** | Conteúdo produzido pela LIA (Nemotron) | Resumos, questões sintéticas, explicações | Baixa (rotulada, não oficial) |
| **Não Verificada** | Qualquer outra origem | Links genéricos, fóruns, blogs, arquivos sem metadados | Baixa (apenas referência) |

---

## 2. Regras de Importação e Versionamento

### 2.1 PDFs Manuais (Usuário)
- **SEMPRE** rotulados `fornecido_pelo_usuario` na tabela `source.type`
- **NUNCA** convertidos automaticamente para `official`
- Solicitar confirmação do usuário se quiser promover para `official` (ex.: "Este PDF é o edital oficial?")
- Hash SHA-256 calculado no ato da importação; deduplicação por hash + metadados

### 2.2 Fontes Oficiais (Web)
- Identificar **órgão responsável** (ex.: Cebraspe, Vunesp, FGV, INEP, MEC)
- Verificar **domínio/URL institucional legítimo** (lista allowlist por exame)
- Registrar **data de publicação**, **edição**, **retificações**, **anexos**
- Calcular **hash SHA-256** do PDF baixado
- Registrar **data de acesso** e **indisponibilidade** (se link quebrar)
- Um resultado de busca **não prova** autenticidade — baixar e hashear o documento

### 2.3 Versionamento de Fontes
- `source_version` para cada atualização (edital retificado, nova edição)
- `change_summary` obrigatório para novas versões
- Comparação automática (M13 Compare) entre versões
- Histórico imutável — nunca sobrescrever versão anterior

---

## 3. Extração e OCR

### 3.1 Extração de Texto
- **Texto + localização** (página, bloco, coordenadas quando possível)
- Preservar **documento original** — nunca sobrescrever arquivo fonte
- `page.text_content` + `page.text_hash` para detectar mudanças

### 3.2 OCR para Digitalizações
- Aplicar OCR (Tesseract/faster-whisper vision) apenas em páginas sem texto extraível
- **Detecção de trechos incertos**: confidence < 0.8 → flag `needs_review`
- **Revisão obrigatória** pelo usuário para trechos flagados antes de usar em questões/estatísticas
- Marcar `ocr_status` e `extraction_status` em `document` e `page`

---

## 4. Conteúdos e Tópicos (Atlas)

### 4.1 Vinculação Obrigatória
- **Cada tópico** no Atlas (`topic`) deve ter pelo menos um `evidence_link` → `citation` → `source_version`
- **Nunca** introduzir assunto como "exigência do edital" sem trecho comprovável (citação com página/trecho)
- `topic.verification_status`:
  - `verified` — tem citação de fonte `official` ou `verified`
  - `needs_review` — tem citação mas fonte `user_file` ou `web` não confirmada
  - `unverified` — sem citação
  - `generated` — criado por LIA, sem fonte

### 4.2 Atualização de Evidência
- Nova versão de fonte → reavaliar `evidence_link` afetados
- Perda de fonte (link quebrado, arquivo removido) → `verification_status = needs_review`

---

## 5. Questões

### 5.1 Metadados Obrigatórios
| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `origin` | SIM | `official` \| `imported` \| `generated_ai` \| `authored` |
| `source_version_id` | Se `official`/`imported` | Link para fonte versionada |
| `exam_id` / `exam_edition_id` | Se `official` | Prova e edição de origem |
| `question_number` | Se `official` | Número na prova original |
| `year` | Se `official` | Ano da edição |
| `verification_status` | SIM | `verified` \| `needs_review` \| `unverified` \| `generated` |

### 5.2 Gabaritos
- `answer_key.source`: `official` \| `imported` \| `inferred`
- **Divergência visível**: se gabarito oficial difere de gabarito importado/inferido → `divergence_note` obrigatório
- Questões `generated_ai` **NUNCA** marcadas como `official` ou usadas em avaliação formal sem revisão humana

### 5.3 Deduplicação
- `question.content_hash` (SHA-256 do enunciado normalizado + alternativas)
- Colisão de hash → revisão semântica manual
- Mesma questão importada 2x → mesmo registro, incrementar contagem de fontes

---

## 6. Estatísticas (Exam Intelligence)

### 6.1 Apresentação Obrigatória
Toda estatística deve mostrar:
- **Contagem** (numerador)
- **Denominador** (total de questões/edições analisadas)
- **Anos/Edições** incluídos
- **Método de classificação** (como tópicos foram mapeados)
- **Margem de incerteza** adequada (ex.: Wilson score interval para proporções)
- **Aviso** se amostra pequena (n < 30 por célula)

### 6.2 Regras
- Frequência histórica **não é** probabilidade preditiva garantida
- Toda estatística **recalculável** a partir de questões com `verification_status = verified`
- Mudança em classificação de questão → recálculo automático + log de auditoria

---

## 7. Produção (Studio, Board, Lab, Oral)

### 7.1 Citações e Referências
- **Somente se verificáveis**: citação deve resolver a um `citation` → `source_version` existente
- **Avisos explícitos** para afirmações sem fonte (UI: badge "Sem fonte verificada")
- **Não fabricar**: autores, DOI, livros, páginas, dados, URLs
- **Preferir** citação resumida + paráfrase (respeito a direitos autorais)
- **ABNT configurável** apenas quando aplicável (Brasil); outros estilos futuros

### 7.2 Geração por LIA
- Output da LIA → `ai_provenance` registrado (model, prompt_hash, params)
- Rotulado `generated` em `verification_status`
- Revisão de consistência **antes** de disponibilizar para avaliação formal (M06/M07)

---

## 8. Defesa contra Dados Maliciosos

### 8.1 Arquivos Importados = Dados Não Confiáveis
- **Nunca** executar código embutido em PDF (JavaScript, launch actions)
- **Nunca** seguir links automáticos em PDFs
- **Sanitizar** HTML/Markdown extraído (ammonia)
- **Limitar** tamanho de arquivo (100 MB) e páginas (1000)

### 8.2 Prompt Injection Documental
- Textos extraídos de PDFs/web **nunca** enviados à LIA sem sanitização
- LIA recebe apenas **trechos selecionados pelo usuário** ou **RAG controlado** (chunks indexados)
- Schemas de tools **fechados** — LIA não pode injetar comandos arbitrários

### 8.3 Rejeição de Instruções Embutidas
- Detectar padrões suspeitos em texto extraído: "ignore previous instructions", "system:", "assistant:", código, comandos shell
- Log de segurança (`audit_event` tipo `prompt_injection_attempt`)
- Bloquear envio à API se detectado

---

## 9. Revisão e Correção Manual

### 9.1 Permitido e Rastreado
- Usuário pode corrigir: classificação de tópico, gabarito, metadados de fonte, causa de erro
- **Toda mudança** → `audit_event` + `version` incrementado + `updated_at`
- `review_flag` para questões contestadas

### 9.2 Bloqueio de Publicação
- Estatísticas oficiais (`exam_intelligence`) com status `unverified` → **não publicadas/exportadas** como definitivas
- Gabaritos `unverified` → visíveis mas com badge "Não verificado"
- Questões `generated_ai` sem revisão → não aparecem em simulados "oficiais"

---

## 10. Conhecimento Geral (Sem Edital)

### 10.1 Geração Livre
- Permitido: explicações de conceitos, analogias, exercícios pedagógicos, resumos de domínio público
- **Marcados** como `conteúdo_explicativo` / `generated`
- **Nunca** fingir proveniência documental ("segundo o edital X..." se não há edital)

### 10.2 Limites
- Não gerar: datas de provas futuras, gabaritos de provas não realizadas, estatísticas inventadas
- LIA deve declarar: "Isso é conhecimento geral, não vem de uma fonte oficial do seu edital"

---

## 11. Checklist de Conformidade (por Feature)

| Feature | Verificação |
|---------|-------------|
| Importar PDF | Hash calculado? Tipo `user_file`? Deduplicado? OCR flagged? |
| Baixar edital oficial | Domínio verificado? Hash salvo? Data acesso? Versão registrada? |
| Criar tópico no Atlas | Pelo menos 1 `evidence_link`? Status correto? |
| Adicionar questão | `origin` preenchido? `source_version_id` se oficial? Gabarito com `source`? |
| Calcular incidência | Denominador mostrado? Amostra < 30 avisada? Recalculável? |
| Gerar resumo (Studio) | Citações resolvem a fontes? Avisos para sem-fonte? ABNT opcional? |
| LIA responde | Contexto minimizado? Consentimento? Proveniência registrada? Tools approved? |

---

*Esta política é vinculante para todo desenvolvimento. Violações são bugs de severidade crítica. Ver `SECURITY.md` para defesas técnicas.*