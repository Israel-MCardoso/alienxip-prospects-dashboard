# Prompt Registry Report

Data: 2026-06-12  
Status: prompt registry preparado, sem chamadas de IA

## Estrutura Criada

Diretorio planejado:

```txt
prompts/
  lead-analyzer.md
  sdr.md
  objections.md
  scheduler.md
  proposal-builder.md
```

## Fonte Metodologica

Os prompts devem usar exclusivamente a metodologia ALIENXIP:

- Lead Analyzer;
- SDR PRO;
- Proposal Builder;
- Framework de Missoes;
- ICPs;
- Pricing Engine;
- Playbook Comercial;
- Base de Objecoes;
- Knowledge Hub (`wiki_pages`);
- Playbooks (`playbooks`);
- diagnosticos, notas, propostas e atividades do prospect.

## Regras Gerais dos Prompts

- Nao inventar oferta, preco, desconto, prazo ou escopo.
- Nao prometer resultado garantido.
- Nao enviar mensagem final sem checagem de opt-out/status.
- Nao gerar proposta final sem revisao humana.
- Se faltar dado da metodologia, retornar necessidade de revisao humana.
- Toda saida deve seguir schema JSON versionado.
- Usar tom consultivo, comercial e objetivo.

## Prompts Preparados

| Arquivo | Responsabilidade |
| --- | --- |
| `lead-analyzer.md` | Diagnostico e leitura de aderencia |
| `sdr.md` | Conversa SDR PRO e proxima resposta |
| `objections.md` | Tratamento de objecoes |
| `scheduler.md` | Decisao de agendamento e handoff |
| `proposal-builder.md` | Brief de proposta, nao proposta final |

## Pendencias Antes de Ativar

1. Conectar loader server-side dos prompts.
2. Versionar prompts com hash.
3. Validar prompts contra massa de teste local.
4. Bloquear prompts sem schema.
5. Registrar versao de prompt em `ai_usage_logs` ou tabela futura complementar.
