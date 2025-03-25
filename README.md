# Gerenciador de Tarefas com Google Agenda

## Descrição do Projeto
Este é um sistema completo de gerenciamento de tarefas que se integra com o Google Agenda, desenvolvido com:

- **Frontend**: HTML5, CSS3 e JavaScript puro
- **Backend**: Parse Server (Back4App)
- **Autenticação**: Google Identity Services e sistema tradicional de email/senha
- **Integração**: Google Calendar API

## Funcionalidades Principais
- ✅ **Autenticação dupla**
  - Login tradicional com email/senha
  - Login rápido com conta Google
  
- 📝 **Gestão de tarefas completa**
  - Adição de tarefas com título, descrição, prazo, prioridade e responsável
  - Atualização de status (Em andamento/Concluída)
  - Exclusão de tarefas

- 📅 **Integração com Google Agenda**
  - Salvar tarefas diretamente no Google Calendar
  - Visualização opcional do calendário

## Pré-requisitos para Teste Local
⚠️ **Importante**: Devido às restrições de segurança do Google Cloud Platform, o sistema só funcionará completamente em:
- **Live Server** (extensão do VSCode)
- **Vercel** (deploy oficial: [https://gerenciador-de-tarefas-swart.vercel.app/](https://gerenciador-de-tarefas-swart.vercel.app/))

## Limitações de Teste
- 🔐 **Acesso ao Google Agenda**:
  - Somente contas de email previamente autorizadas no Google Cloud Console poderão usar a função de salvar no Google Agenda.
  - Se fizer login com email/senha (não Google), a opção de agendamento não estará disponível.

## Como Executar Localmente
1. Clone o repositório
2. Abra o projeto no VSCode
3. Instale a extensão **"Live Server"**
4. Execute o `index.html` com Live Server

## Tecnologias Utilizadas
- **Parse SDK (Back4App)**: Backend como serviço
- **Google Identity Services**: Autenticação com Google
- **Google Calendar API**: Integração com agenda
- **LocalStorage**: Armazenamento de tokens localmente

## Configuração do Ambiente
Para configurar seu próprio ambiente:

1. Crie um projeto no **Google Cloud Console**
2. Ative as APIs: **Google Calendar** e **Identity Services**
3. Configure URIs autorizados (incluindo http://localhost e seu domínio Vercel)
4. Adicione emails de teste autorizados
