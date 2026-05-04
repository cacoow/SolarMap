# SolarMap
Projeto UPX - Facens / Com o intuito de auxiliar potenciais empreendedores de produção de energias renováveis, o SolarMap vai mostrar as áreas que estão mais aptas a receber os equipamentos levantando dados do local.

O **SolarMap** é uma plataforma inteligente desenvolvida como parte do projeto UPX da Facens. O objetivo principal é auxiliar empreendedores e proprietários residenciais a identificar o potencial de geração de energia solar em suas regiões, utilizando dados de mapeamento e ferramentas de simulação.

## Status do Desenvolvimento

O projeto está em fase de construção. Confira abaixo o que já está funcional e o que está planejado:

*   **Landing Page (Início):** - Concluído
*   **Mapa Solar Interativo:** - Concluído (Integração com Google Maps e Heatmaps)
*   **Sistema de Autenticação:** - Em desenvolvimento (Lógica implementada, integração com banco de dados em ajuste)
*   **Simulador de Economia:** - Em desenvolvimento
*   **Dashboard de Impacto:** - Em desenvolvimento

## Funcionalidades

### 1. Mapa Solar Interativo (Concluído)
*   **Visualização Geográfica:** Identifica áreas com maior índice de irradiação solar através de uma camada de Heatmap.
*   **Busca de Pontos:** Integração com a API de Places do Google para identificar locais relevantes.
*   **Dados em Tempo Real:** Clique no mapa para obter coordenadas e estimativas de irradiação da área selecionada.

### 2. Sistema de Autenticação (Em desenvolvimento)
*   Gerenciamento de usuários (Cadastro/Login) utilizando **Supabase**.
*   Criação de perfis para salvar histórico de simulações.

### 3. Simulador de Economia (Em desenvolvimento)
*   Ferramenta para calcular a viabilidade técnica e financeira da instalação de painéis fotovoltaicos com base no consumo mensal do usuário.

### 4. Dashboard (Em desenvolvimento)
*   Painel visual com gráficos de economia estimada e impacto ambiental positivo (redução de emissões de CO₂).

## Tecnologias Utilizadas

*   **Front-End:** HTML5, CSS3 (Design responsivo) e JavaScript (ES6+).
*   **APIs de Mapeamento:** [Google Maps Platform](https://developers.google.com/maps) (Maps, Places, Visualization).
*   **Back-End & Database:** [Supabase](https://supabase.com/) (Autenticação e armazenamento).
*   **Gráficos:** [Chart.js](https://www.chartjs.org/) (Planejado para o Dashboard).

## Estrutura de Pastas

```text
SolarMap/
├── Front-End/
│   ├── assets/             # Estilos, Imagens e Scripts Globais
│   │   ├── css/            # Estilização (style.css)
│   │   ├── js/             # Lógica de Autenticação, Config e Mapa
│   ├── pages/              # Páginas internas (Mapa, Simulador, Login)
│   └── index.html          # Página inicial do projeto
└── README.md
```

## Configuração para Testes

Para que o projeto funcione localmente com todas as integrações, siga estes passos:

1.  **Google Maps API:** Insira sua chave de API no script presente em `Front-End/pages/mapa.html`.
2.  **Supabase:** Adicione suas credenciais (`URL` e `ANON_KEY`) no arquivo `Front-End/assets/js/config.js`.
3.  **Execução:** Utilize uma extensão como o *Live Server* no VS Code para abrir o `index.html`, garantindo que as chamadas de API funcionem corretamente.

---
**Desenvolvido para o Projeto UPX - Facens / Sorocaba - SP**  
*Foco em energia limpa, sustentabilidade e inovação tecnológica.*
