# 🌱 AgroSolution - Frontend

**AgroSolution** é uma aplicação web desenvolvida para o gerenciamento inteligente de propriedades rurais e talhões agrícolas. O sistema permite monitorar, cadastrar e atualizar informações de forma prática e centralizada, auxiliando produtores rurais na gestão de suas áreas de cultivo.

## 📋 Sobre o Projeto

O AgroSolution foi criado como projeto acadêmico na **FIAP** e tem como objetivo fornecer uma plataforma moderna para a gestão agrícola digital. A aplicação frontend consome uma API RESTful desenvolvida em .NET Core, oferecendo uma experiência de usuário fluida e responsiva.

## 🚀 Funcionalidades

### Propriedades
- **Cadastro de propriedades** — registre propriedades rurais com nome, descrição, localização (cidade, UF, latitude, longitude) e área total
- **Listagem de propriedades** — visualize todas as suas propriedades cadastradas em cards organizados
- **Edição inline** — atualize os dados da propriedade diretamente na tela de listagem
- **Exclusão** — remova propriedades com confirmação via modal
- **Alteração de status** — ative ou desative propriedades com um clique no badge de status
- **Busca de cidades** — integração com a BrasilAPI para preenchimento automático de cidade e UF

### Talhões
- **Cadastro de talhões** — registre talhões vinculados a uma propriedade ativa, informando nome, cultura, área em hectares e status
- **Listagem por propriedade** — visualize os talhões de cada propriedade em seções expansíveis
- **Edição inline** — atualize nome, cultura, área e status dos talhões diretamente na listagem
- **Validação de propriedade ativa** — somente propriedades ativas podem receber novos talhões ou ter talhões editados

### Autenticação
- **Login e cadastro** de usuários com autenticação via JWT
- **Interceptor HTTP** para envio automático do token em todas as requisições
- **Guard de rotas** para proteção das páginas autenticadas

## 🛠️ Tecnologias

| Tecnologia | Versão |
|---|---|
| Angular | 19 |
| TypeScript | 5.6 |
| RxJS | 7.8 |
| SCSS | - |
| Nginx | 1.27 (produção) |
| Docker | Multi-stage build |

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── guards/                  # Guard de autenticação
│   ├── interceptors/            # Interceptor HTTP (JWT)
│   ├── layouts/                 # Layout autenticado (sidebar + header)
│   ├── pages/
│   │   ├── cadastrar-propriedade/   # Formulário de cadastro de propriedade
│   │   ├── cadastrar-talhao/        # Formulário de cadastro de talhão
│   │   ├── cadastro/                # Tela de cadastro de usuário
│   │   ├── dashboard/               # Dashboard principal
│   │   ├── login/                   # Tela de login
│   │   └── minhas-propriedades/     # Listagem, edição e exclusão
│   └── services/
│       ├── auth.service.ts          # Serviço de autenticação
│       ├── propriedade.service.ts   # Serviço de propriedades
│       └── talhao.service.ts        # Serviço de talhões
├── index.html
├── main.ts
└── styles.scss
```

## ⚙️ Como Executar

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v20+)
- [Angular CLI](https://angular.dev/) (v19+)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/MatheusF3lipe/AgroSolution_Front_FIAP.git

# Acesse o diretório
cd AgroSolution_Front_FIAP

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
ng serve
```

A aplicação estará disponível em `http://localhost:4200`.

### Docker

```bash
# Build da imagem
docker build -t agrosolution-frontend .

# Executar o container
docker run -d -p 4200:80 --name agrosolution-front agrosolution-frontend
```

## 🔗 Backend

Esta aplicação consome a API desenvolvida em **.NET Core**, que possui os seguintes microsserviços:

- **AGS_Usuarios** — Gerenciamento de usuários e autenticação (porta 7158)
- **AGS_Propriedades** — Gerenciamento de propriedades e talhões (porta 7117)

## 👥 Autores

Projeto desenvolvido por alunos da **FIAP** como parte do programa de graduação.
