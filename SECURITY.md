# Segurança e Privacidade — PRISMA

## Princípios Fundamentais

1. **Local-first por padrão** — Dados no dispositivo do usuário; zero dependência de nuvem
2. **Privacidade por design** — Telemetria OFF; consentimento granular; minimização de dados
3. **Segurança em profundidade** — Allowlist mínima, DPAPI, validação de entrada, auditoria
4. **Transparência** — Usuário controla o que sai do PC; logs reproduzíveis sem segredos

---

## 1. Arquitetura de Segurança (Tauri 2)

### Allowlist Mínima (tauri.conf.json)

```json
{
  "allowlist": {
    "all": false,
    "fs": {
      "all": false,
      "readFile": true,
      "writeFile": true,
      "readDir": true,
      "copyFile": true,
      "createDir": true,
      "removeFile": true,
      "removeDir": true,
      "scope": ["$APPDATA/PRISMA/**", "$TEMP/PRISMA/**"]
    },
    "dialog": {
      "all": false,
      "open": true,
      "save": true,
      "message": true
    },
    "shell": {
      "all": false,
      "open": true
    },
    "path": {
      "all": false,
      "resolve": true,
      "appDir": true,
      "appDataDir": true,
      "tempDir": true
    },
    "window": {
      "all": false,
      "create": true,
      "close": true,
      "minimize": true,
      "maximize": true,
      "unmaximize": true,
      "show": true,
      "hide": true,
      "setTitle": true,
      "setFullscreen": true
    },
    "notification": {
      "all": false,
      "show": true
    },
    "clipboard": {
      "all": false,
      "readText": true,
      "writeText": true
    },
    "globalShortcut": {
      "all": false,
      "register": true,
      "unregister": true
    }
  }
}
```

**Nenhum comando shell genérico** (`shell.execute`, `shell.sidecar` sem allowlist específica) exposto ao frontend ou LLM.

### Comandos Rust (Allowlist Explícita)

Cada comando em `src-tauri/src/commands/` é registrado explicitamente:

```rust
// Exemplo: tauri::generate_handler![
    commands::profile::create_profile,
    commands::profile::get_profile,
    commands::profile::list_profiles,
    commands::profile::update_profile,
    commands::profile::delete_profile,
    // ... comandos por domínio
]
```

### Validação de Entrada

- **Schema JSON** para todo input (serde + `validator` crate)
- **Sanitização** de paths (prevenção path traversal)
- **Limites de tamanho** em uploads/arquivos (ex.: 100 MB max por arquivo)
- **Rate limiting** em comandos sensíveis (ex.: backup, export)

---

## 2. Gestão de Credenciais e Segredos

### Windows Credential Manager (DPAPI)

```rust
// crates/security/src/credential_manager.rs
use windows::Security::Credentials::PasswordVault;
use windows::Security::Cryptography::DataProtection::DataProtectionProvider;

pub struct CredentialManager;

impl CredentialManager {
    pub fn store_api_key(key: &str) -> Result<(), SecurityError> {
        let vault = PasswordVault::new()?;
        let credential = PasswordCredential::new(
            "PRISMA_NVIDIA_API_KEY",
            "user",
            key
        )?;
        vault.Add(&credential)?;
        Ok(())
    }

    pub fn retrieve_api_key() -> Result<Option<String>, SecurityError> {
        let vault = PasswordVault::new()?;
        let credentials = vault.FindAllByResource("PRISMA_NVIDIA_API_KEY")?;
        if credentials.Size() > 0 {
            let cred = credentials.GetAt(0)?;
            cred.RetrievePassword()?;
            Ok(Some(cred.Password()?.to_string()))
        } else {
            Ok(None)
        }
    }

    pub fn delete_api_key() -> Result<(), SecurityError> {
        let vault = PasswordVault::new()?;
        let credentials = vault.FindAllByResource("PRISMA_NVIDIA_API_KEY")?;
        for i in 0..credentials.Size() {
            vault.Remove(&credentials.GetAt(i)?)?;
        }
        Ok(())
    }
}
```

### Regras Obrigatórias

| Segredo | Armazenamento | Exibição |
|---------|---------------|----------|
| API Key NVIDIA | Windows Credential Manager (DPAPI) | **Nunca** inteira; apenas `sk-***` nas configurações |
| Chaves de criptografia DB | DPAPI (derivada de senha do usuário) | Nunca |
| Tokens de sessão LIA | Memória apenas (não persistido) | Nunca |
| Hashes de documentos | SQLite (não sensível) | Visível em logs de auditoria |

**NUNCA** em: `localStorage`, `IndexedDB`, SQLite em texto puro, logs, telemetria, capturas de tela, repositório git.

---

## 3. Proteção de Dados Sensíveis

### Criptografia de Banco (Opcional, Futuro)

- **SQLCipher** ou `sqld` com chave derivada via DPAPI
- Chave mestra no Credential Manager
- Ativado por configuração do usuário (padrão: OFF para performance)

### Sanitização de Saída

```rust
// Prevenção XSS em conteúdo renderizado
pub fn sanitize_html(input: &str) -> String {
    ammonia::clean(input)
}

// Prevenção SQL Injection — SEMPRE prepared statements
// NUNCA: format!("SELECT * FROM t WHERE x = '{}'", user_input)
// SEMPRE: sqlx::query("SELECT * FROM t WHERE x = ?").bind(user_input)
```

### Proteção contra Prompt Injection Documental

- PDFs/arquivos importados tratados como **dados não confiáveis**
- Extração de texto: apenas conteúdo, **nunca** execução de JavaScript embutido
- LIA: schemas fechados para tools; validação de output; nenhuma ação sensível sem aprovação humana

---

## 4. Comunicação com IA (NVIDIA Nemotron)

### Fluxo de Dados

```
User Query → PRISMA Frontend
    ↓
Rust Command (validate, sanitize, minimize context)
    ↓
NVIDIA API (HTTPS, TLS 1.2+, timeout 60s)
    ↓
Response → Validate Schema → Store Provenance → Return to UI
```

### Controles de Privacidade

| Controle | Implementação |
|----------|---------------|
| **Consentimento por sessão** | Checkbox "Permitir envio à LIA" por conversa/projeto |
| **Minimização de contexto** | Apenas trechos relevantes (RAG local), nunca documentos completos por padrão |
| **Opt-out de memória** | `memory_opt_in` por conversa; padrão FALSE |
| **Logs de consumo** | Local apenas: tokens, latência, modelo, timestamp (sem conteúdo) |
| **Budget configurável** | Limite mensal de tokens/requests; alerta ao atingir 80% |
| **Cancelamento** | Botão "Parar" na UI cancela request HTTP em andamento |

### Tratamento de Erros da API

| Código | Ação |
|--------|------|
| `401` | Chave inválida/ausente → solicitar nova chave nas configurações |
| `429` | Rate limit → retry exponencial com jitter (max 3), informar usuário |
| `503` | Indisponível → retry (max 2), modo offline automático |
| `Timeout` | Cancelar, informar, preservar histórico local |
| `Schema inválido` | Log, fallback para resposta textual, não quebrar app |

---

## 5. Telemetria e Diagnóstico

### Política: **OFF por padrão**

```rust
// Telemetry config (user_setting)
{
  "telemetry": {
    "enabled": false,
    "categories": {
      "usage": false,
      "performance": false,
      "errors": false,
      "ai_usage": false
    },
    "retention_days": 30,
    "endpoint": null // Sem backend → apenas exportação manual
  }
}
```

### Se Habilitada (Consentimento Granular)

- **Categorias independentes**: uso, performance, erros, uso de IA
- **Dados**: contadores, latências, códigos de erro, contagem de tokens — **sem conteúdo, sem PII**
- **Armazenamento**: Local SQLite (`telemetry_event` table)
- **Exportação**: Botão "Exportar diagnóstico" → JSON/CSV
- **Revogação**: Imediata; dados locais deletados

**Sem backend consentido → ZERO tráfego de rede para telemetria.**

---

## 6. Voz (STT/TTS)

### Controles de Microfone

| Recurso | Implementação |
|---------|---------------|
| **Ativação** | Push-to-talk (botão segurar) — padrão |
| **Palavra-chave** | Apenas opt-in + modelo local (ex.: Porcupine) se viável |
| **Indicador visual** | Ícone de microfone animado + tooltip "Gravando..." |
| **Auto-stop** | Silêncio > 3s ou botão solto |
| **Fala não ativa a si própria** | TTS pausa STT durante reprodução |
| **Gravação persistente** | OFF por padrão; opcional por sessão |
| **Sem escuta oculta** | Microfone só abre com ação explícita do usuário |

### Processamento Local (Prioridade)

1. **faster-whisper** (CTranslate2) — STT local, Apache-2.0
2. **Piper** — TTS local, MIT
3. **Reaproveitamento NanoMuse** — Apenas se acessível legalmente, compatível, revisado, autorizado
4. **Sem dependência runtime do NanoMuse** — Sidecar empacotado independente

---

## 7. Gamificação — Segurança Comportamental

- **Sem penalidades** por descanso, sono, pausas
- **Sem streaks obrigatórios** — configurável, desabilitável
- **Sem dark patterns** (notificações manipulativas, FOMO)
- **Dados de gamificação** isolados; não influenciam notas, cronogramas, performance oficial

---

## 8. Backups e Recuperação

### Backup Local

```rust
// Estrutura do backup
struct BackupManifest {
    version: u32,
    profile_id: Uuid,
    created_at: DateTime<Utc>,
    tables: Vec<String>, // todas ou subset
    content_hashes: HashMap<String, String>, // table -> SHA-256
    schema_version: u32,
}
```

- **Teste de restauração** obrigatório na criação (restaurar em DB temp, validar contagens)
- **Exportação** para local escolhido pelo usuário (ZIP + manifest)
- **Opção de excluir histórico** (LGPD/GDPR-like) — apaga dados do perfil, mantém estrutura

---

## 9. Auditoria e Rastreabilidade

### Tabela `audit_event` (Imutável)

| Campo | Descrição |
|-------|-----------|
| `event_type` | create, update, delete, login, export, import, config_change, permission_change |
| `entity_type` | Tabela afetada |
| `entity_id` | PK da entidade |
| `old_values_json` | Estado anterior (para update/delete) |
| `new_values_json` | Estado novo (para create/update) |
| `created_at` | UTC timestamp |

**Nunca** logado: senhas, chaves API, conteúdo de documentos privados, conversas LIA (apenas metadados).

---

## 10. Hardening do Binário Windows

| Medida | Status |
|--------|--------|
| ASLR / DEP | Habilitado (Rust default) |
| Stack cookies | Habilitado (MSVC) |
| Assinatura de código | Futuro (certificado EV) |
| Verificação de integridade | SHA-256 do instalador publicado |
| Atualizações seguras | Futuro: Tauri Updater com assinatura |

---

## 11. Checklist de Segurança por Release

- [ ] Allowlist Tauri mínima revisada
- [ ] Todos os comandos validam input (schema + sanitização)
- [ ] Credenciais apenas no Credential Manager
- [ ] Zero segredos em logs, DB, localStorage, telemetria
- [ ] API NVIDIA: timeout, retry, cancelamento, budget
- [ ] Telemetria OFF por padrão; consentimento granular testado
- [ ] Voz: push-to-talk padrão; indicador visual; zero gravação oculta
- [ ] Backup: restauração testada; exportação funcional
- [ ] Auditoria: eventos sensíveis registrados sem dados sensíveis
- [ ] Instalador NSIS: per-user, WebView2 bootstrapper, checksum SHA-256

---

*Atualizado a cada mudança de arquitetura de segurança. Ver `CHANGELOG.md`.*