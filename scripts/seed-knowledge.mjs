import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());

loadLocalEnv(".env.local");
loadLocalEnv(".env");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || supabaseUrl.includes("YOUR_PROJECT_REF")) {
  fail("NEXT_PUBLIC_SUPABASE_URL is required.");
}

if (!serviceRoleKey || serviceRoleKey.includes("YOUR_")) {
  fail("SUPABASE_SERVICE_ROLE_KEY is required.");
}

// Slugs are generated from titles.
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const wikiPagesToSeed = [
  {
    title: "Processo Comercial",
    slug: slugify("Processo Comercial"),
    content: `# Processo Comercial ALIENXIP

## Objetivo
Padronizar as etapas comerciais para aumentar a taxa de conversão e manter o pipeline atualizado.

## Etapas do Funil
1. **Frio / Prospecção:** Identificação inicial de prospects e contato inicial.
2. **Diagnóstico:** Reunião técnica para identificar falhas e propor soluções digitais.
3. **Proposta:** Apresentação da proposta comercial e escopo técnico.
4. **Negociação:** Ajustes comerciais, precificação e prazos.
5. **Fechado (Ganho):** Conversão em Cliente e Projeto.

## Regras
- Cada prospect deve possuir pelo menos um follow-up ativo com data definida.
- Registre todas as notas de reunião e decisões na aba Notas.`,
    category: "vendas",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Processo de Prospecção",
    slug: slugify("Processo de Prospecção"),
    content: `# Processo de Prospecção

## Fontes de Leads
- Planilhas importadas de inteligência comercial.
- Prospecção ativa via Instagram e Sites institucionais.
- Indicações e tráfego orgânico.

## Critérios de Qualificação
- Empresa ativa com necessidade de presença digital.
- Segmento com ticket médio compatível com nossas ofertas.
- Contato direto com tomadores de decisão (sócios, diretores).

## Cadência de Contatos
- Dia 1: Mensagem inicial de conexão.
- Dia 3: Follow-up 1 (Envio de material rápido).
- Dia 5: Follow-up 2 (Agendamento de reunião de Diagnóstico).`,
    category: "prospeccao",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Processo de Desenvolvimento",
    slug: slugify("Processo de Desenvolvimento"),
    content: `# Processo de Desenvolvimento

## Stack Padrão
- Next.js (TailwindCSS, TypeScript)
- Supabase (Auth, RLS, Storage)
- Vercel (Hospedagem e CI/CD)

## Fluxo de Trabalho
1. **Planejamento:** Criação do projeto e detalhamento de tarefas.
2. **Desenvolvimento:** Divisão em features, com commits limpos.
3. **Revisão e QA:** Validação de design, responsividade e performance.
4. **Deploy:** Lançamento seguro e monitoramento de incidentes.`,
    category: "desenvolvimento",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Processo de Diagnóstico",
    slug: slugify("Processo de Diagnóstico"),
    content: `# Processo de Diagnóstico Digital

## Objetivo
Analisar criticamente a presença online de um prospect para fundamentar a proposta comercial.

## Elementos Analisados
1. **Website/Landing Page:** Velocidade, UX, mobile, SEO técnico.
2. **Instagram:** Frequência de postagem, qualidade visual, biografia clara, links funcionais.
3. **Google Meu Negócio:** Avaliações, respostas e informações atualizadas.
4. **WhatsApp:** Automatizações iniciais e velocidade de resposta.

## Entrega
O diagnóstico serve como argumento para propor um projeto de alta performance.`,
    category: "prospeccao",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Processo de Deploy",
    slug: slugify("Processo de Deploy"),
    content: `# Processo de Deploy em Produção

## Checklist Pré-Deploy
- [ ] Testes automatizados passando localmente (\`npm test\`).
- [ ] Validação de Lint sem erros (\`npm run lint\`).
- [ ] Build de produção gerado com sucesso (\`npm run build\`).
- [ ] Variáveis de ambiente configuradas no painel da Vercel.

## Procedimento
1. Pull Request aprovado e mergeado para branch \`main\`.
2. Vercel executa o deploy automático.
3. Executar smoke test manual nas principais rotas protegidas e públicas.
4. Monitorar ferramentas de log por 15 minutos pós-deploy.`,
    category: "desenvolvimento",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Processo de Atendimento",
    slug: slugify("Processo de Atendimento"),
    content: `# Processo de Atendimento ao Cliente

## Regras de Ouro
- Retorno rápido de mensagens operacionais (máximo 4 horas em horário comercial).
- Transparência absoluta sobre prazos de entregas e limites do escopo.
- Reuniões semanais ou quinzenais rápidas para acompanhamento de tarefas (Sprint Reviews).

## Suporte Técnico
- Abertura de bugs via Tech Center.
- Reporte rápido de incidentes operacionais críticos.
- Registro de ADRs para decisões que alterem a arquitetura ou escopo contratado.`,
    category: "suporte",
    status: "published",
    review_status: "approved"
  }
];

const playbooksToSeed = [
  {
    title: "Prospecção Fria",
    description: "Roteiro e cadência de abordagens comerciais para prospecção fria.",
    content: `## Playbook de Abordagem Fria

### 1. Mensagem de Conexão Inicial (Instagram/WhatsApp)
"Olá, [Nome]! Vi seu perfil no [Rede Social] e achei muito interessante a atuação do [Nome da Empresa] no setor de [Segmento]. Analisamos rapidamente sua presença online e identificamos oportunidades excelentes para acelerar seus canais digitais. Teria 5 minutos para um café virtual rápido esta semana?"

### 2. Tratamento de Objeções
- *"Não temos interesse agora":* "Perfeitamente, [Nome]. Se me permitir, deixarei nosso portfólio rápido. Caso surja alguma necessidade no futuro, conte conosco."
- *"Qual o valor?":* "O valor varia de acordo com o escopo técnico. Fazemos uma reunião rápida de 10 minutos para entender sua operação e montar o escopo exato para você."`,
    category: "prospeccao",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Follow-up",
    description: "Playbook para cadência e mensagens de acompanhamento comercial.",
    content: `## Playbook de Follow-up Comercial

### Frequência recomendada
- **Follow-up 1 (2 dias após proposta):** Perguntar se há dúvidas técnicas ou se o time financeiro já analisou a proposta.
- **Follow-up 2 (5 dias após proposta):** Apresentar um caso de sucesso similar para quebrar objeção de valor.
- **Follow-up 3 (10 dias após proposta):** Última tentativa oferecendo uma condição especial ou agendamento de chamada técnica final.

### Template Follow-up 1
"Olá, [Nome], tudo bem? Conseguiram revisar a proposta que enviamos na [Dia]? Fico à disposição se quiserem sanar qualquer dúvida técnica sobre o escopo da Landing Page."`,
    category: "vendas",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Diagnóstico Digital",
    description: "Como conduzir e registrar a análise digital de prospects.",
    content: `## Como Realizar um Diagnóstico Digital

### Ferramentas de Apoio
- Google PageSpeed Insights (velocidade móvel/desktop)
- Google Mobile-Friendly Test (adaptatividade)
- Inspeção Visual manual (links quebrados, fontes ruins, CTAs ineficazes)

### Registro na ALIENXIP OS
1. Navegue até o prospect correspondente.
2. Acesse a aba **Diagnóstico Digital**.
3. Escreva notas resumidas para Facebook, Instagram, WhatsApp e Website.
4. Defina as **Oportunidades** encontradas de forma concisa e salve.`,
    category: "prospeccao",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Landing Page",
    description: "Checklist de desenvolvimento e otimização para Landing Pages.",
    content: `## Playbook de Entrega de Landing Pages

### Escopo Essencial
- Cabeçalho limpo com logo e CTA claro acima da dobra.
- Seção de benefícios estruturada.
- Prova social/depoimentos em destaque.
- FAQ sanando principais dúvidas.
- Rodapé com dados de contato, CNPJ e política de privacidade.

### Otimizações Obrigatórias
- Compactação e compressão de imagens (formato WebP).
- Lazy loading ativo para mídias fora da tela.
- SEO básico (Tags Title, Meta Description e Heading Structure H1-H3).`,
    category: "desenvolvimento",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Sistema Web",
    description: "Diretrizes e melhores práticas para desenvolvimento de sistemas web premium.",
    content: `## Playbook de Desenvolvimento de Sistemas Web

### Princípios de Interface
- **Foco em performance:** Minimizar bundle sizes, usar server rendering quando aplicável.
- **Identidade Visual harmoniosa:** Evitar cores berrantes, utilizar paletas consistentes, tipografia de alto padrão.
- **Micro-animações:** Interações fluidas em botões, links e loadings aumentam a percepção de qualidade do produto.

### Backend & Segurança
- Row Level Security (RLS) habilitada em todas as tabelas no Supabase.
- Validação de entrada via schemas robustos (Zod) no backend e no frontend.`,
    category: "desenvolvimento",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Onboarding",
    description: "Processo de integração e boas-vindas para novos clientes.",
    content: `## Playbook de Onboarding do Cliente

### Passos Imediatos Pós-Fechamento
1. **E-mail de Boas-vindas:** Enviar links de acesso e apresentar o time de desenvolvimento.
2. **Setup do Canal de Comunicação:** Alinhar canal principal de contato diário.
3. **Setup Interno (ALIENXIP OS):**
   - Criar cliente/empresa (se ainda não existir).
   - Criar o primeiro Projeto vinculando prazos e responsável.
   - Agendar reunião de kickoff técnica para levantamento de requisitos.`,
    category: "operacao",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Incidente",
    description: "Fluxo de resolução e comunicação de incidentes operacionais.",
    content: `## Playbook de Resolução de Incidentes

### Classificação de Severidade
- **Critical:** Sistema completamente fora do ar ou perda de dados crítica.
- **High:** Principais fluxos de conversão afetados (ex: formulário de cadastro quebrado).
- **Medium/Low:** Falhas visuais menores ou recursos administrativos secundários fora do ar.

### Ações de Resolução
1. Criar o Incidente no **Tech Center** indicando a severidade.
2. Identificar a causa raiz analisando os logs mais recentes de deploy.
3. Se necessário, efetuar Rollback imediato do deploy.
4. Notificar a equipe interna e atualizar o status do incidente para "Resolved" assim que sanado.`,
    category: "suporte",
    status: "published",
    review_status: "approved"
  },
  {
    title: "Postmortem",
    description: "Estrutura padrão para documentação e análise pós-incidente.",
    content: `## Playbook de Documentação de Postmortem

### Quando criar?
Obrigatório para todo incidente de severidade **Critical** ou **High** dentro de 48 horas após a resolução.

### Estrutura do Relatório
1. **Resumo Executivo:** O que aconteceu, quando começou e quando foi solucionado.
2. **Impacto:** Volume de usuários afetados, perda financeira estimada ou interrupção de serviço.
3. **Causa Raiz:** O erro técnico ou procedimental exato que gerou a falha.
4. **Plano de Prevenção:** Lista de tarefas (backlog técnico) para evitar novas ocorrências.`,
    category: "suporte",
    status: "published",
    review_status: "approved"
  }
];

async function seedData() {
  console.log("Iniciando seed de conhecimento da ALIENXIP...");

  // Seed Wiki Pages
  for (const page of wikiPagesToSeed) {
    console.log(`Seeding Wiki: ${page.title}...`);
    
    // Check if exists
    const existingResult = await supabaseRest(`/rest/v1/wiki_pages?slug=eq.${page.slug}`, {
      method: "GET"
    });
    
    if (existingResult && existingResult.length > 0) {
      console.log(`Wiki Page com slug ${page.slug} já existe. Atualizando conteúdo...`);
      await supabaseRest(`/rest/v1/wiki_pages?slug=eq.${page.slug}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: page.title,
          content: page.content,
          category: page.category,
          status: page.status,
          review_status: page.review_status
        })
      });
    } else {
      await supabaseRest("/rest/v1/wiki_pages", {
        method: "POST",
        body: JSON.stringify(page)
      });
      console.log(`Wiki Page criada.`);
    }
  }

  // Seed Playbooks
  for (const playbook of playbooksToSeed) {
    console.log(`Seeding Playbook: ${playbook.title}...`);
    
    // Check if exists by title
    const existingResult = await supabaseRest(`/rest/v1/playbooks?title=eq.${encodeURIComponent(playbook.title)}`, {
      method: "GET"
    });
    
    if (existingResult && existingResult.length > 0) {
      console.log(`Playbook com título "${playbook.title}" já existe. Atualizando conteúdo...`);
      const existingId = existingResult[0].id;
      await supabaseRest(`/rest/v1/playbooks?id=eq.${existingId}`, {
        method: "PATCH",
        body: JSON.stringify(playbook)
      });
    } else {
      await supabaseRest("/rest/v1/playbooks", {
        method: "POST",
        body: JSON.stringify(playbook)
      });
      console.log(`Playbook criado.`);
    }
  }

  console.log("Seed de conhecimento concluído com sucesso e idempotência garantida!");
}

seedData().catch((err) => {
  console.error("Erro ao executar seed:", err);
  process.exit(1);
});

async function supabaseRest(path, init) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    fail(`Supabase request failed: ${response.status} ${response.statusText}\n${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function loadLocalEnv(fileName) {
  const filePath = join(root, fileName);
  if (!existsSync(filePath)) return;

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
