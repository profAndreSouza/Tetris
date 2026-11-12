# Tetris

Um Tetris simples, bonito e responsivo, com frontend React + Vite e API Java Spring Boot.

## Executar

Requisitos: Java 17+, Maven e Node.js 20+.

Na raiz do projeto, em terminais separados:

```powershell
cd backend
mvn spring-boot:run
```

```powershell
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. A API fica em http://localhost:8080.

## Executar com Docker

Para subir o frontend e a API juntos, na raiz do projeto:

```powershell
docker compose up --build
```

Abra http://localhost:8081. Para encerrar, use `Ctrl+C` e rode `docker compose down`.

### Publicar no Docker Hub pelo GitHub Actions

Configure os secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` nas configurações do repositório GitHub. O workflow `.github/workflows/publish-dockerhub.yml` publica as imagens `SEU_USUARIO/tetris-frontend` e `SEU_USUARIO/tetris-api` ao enviar commits para `main`. Cada execução publica as tags `latest`, `vN` (número sequencial da execução) e o SHA do commit. Também é possível executá-lo manualmente pela aba **Actions**.

### Deploy automático na EC2

O deploy fica em um workflow separado: `.github/workflows/deploy-ec2.yml`. Ele inicia automaticamente após o workflow de publicação concluir com sucesso na branch `main`, e também pode ser iniciado manualmente pela aba **Actions**. Ele baixa as imagens `latest`, remove os containers anteriores e inicia os novos com `docker run`. O frontend fica na porta 80 e a API na 8080.

#### 1. Prepare a instância EC2

Use uma instância Ubuntu com Docker instalado e confirme que o usuário configurado em `EC2_USER` consegue executar `sudo docker`. O deploy usa `docker pull` e `docker run`; não precisa do Docker Compose na EC2. No Security Group, permita entrada TCP na porta 80 para acessar o jogo e na porta 8080 para permitir que o navegador acesse o placar. Restrinja o SSH (porta 22) ao seu IP sempre que possível.

#### 2. Gere e instale a chave SSH de deploy

No PowerShell do seu computador, gere uma chave dedicada:

```powershell
ssh-keygen -t ed25519 -C "github-actions-tetris" -f "$env:USERPROFILE\.ssh\tetris-ec2"
```

Adicione a chave pública ao `authorized_keys` do usuário da EC2:

```bash
cat "$env:USERPROFILE\.ssh\tetris-ec2.pub" >> ~/.ssh/authorized_keys
```

Use o arquivo **público** `tetris-ec2.pub` nesse comando; o arquivo privado `tetris-ec2` vai somente no secret `EC2_SSH_KEY`. Use o usuário correto da AMI (`ubuntu` no Ubuntu; `ec2-user` em Amazon Linux). Teste a conexão a partir do seu computador:

```powershell
ssh -i "$env:USERPROFILE\.ssh\tetris-ec2" ubuntu@IP_PUBLICO_DA_EC2
```

Troque `ubuntu` e `IP_PUBLICO_DA_EC2` pelos dados da sua instância. Mantenha a chave privada `tetris-ec2` apenas no computador e no secret do GitHub.

#### 3. Crie um token do Docker Hub

No Docker Hub, abra **Account Settings → Personal access tokens → Generate new token**. Dê um nome como `github-actions-tetris`, selecione permissão **Read & Write** e gere o token. Copie-o ao criá-lo; depois não será possível ver o valor novamente. O workflow de publicação usa o token para enviar imagens. Como as imagens publicadas são públicas, a EC2 não precisa desse token para baixar as imagens.

#### 4. Cadastre os secrets no GitHub

No repositório, abra **Settings → Secrets and variables → Actions → New repository secret** e crie:

| Secret | Valor |
| --- | --- |
| `DOCKERHUB_USERNAME` | Seu nome de usuário do Docker Hub |
| `DOCKERHUB_TOKEN` | Token de acesso do Docker Hub com permissão Read & Write |
| `EC2_HOST` | IP público ou DNS público da instância EC2 |
| `EC2_USER` | Usuário SSH da instância, por exemplo `ubuntu` |
| `EC2_SSH_KEY` | Conteúdo completo da chave privada `tetris-ec2`, incluindo as linhas BEGIN/END |

Para copiar a chave privada no PowerShell e colá-la no secret, use:

```powershell
cat "$env:USERPROFILE\.ssh\tetris-ec2"
```

Não coloque tokens nem a chave privada em arquivos do repositório. Depois de configurar os secrets, publique para `main`; o workflow de deploy será acionado após a publicação. Acesse `http://IP_PUBLICO_DA_EC2` e configure o endereço do backend como `http://IP_PUBLICO_DA_EC2:8080` no placar.

Também é possível construir e iniciar cada imagem separadamente:

Na raiz do projeto, construa as imagens:

```powershell
docker build -t tetris-frontend ./frontend
docker build -t tetris-api ./backend
```

Rode a API e o frontend em terminais separados:

```powershell
docker run --rm --name tetris-api -p 8080:8080 tetris-api
```

```powershell
docker run --rm --name tetris-frontend -p 8081:80 tetris-frontend
```

Abra http://localhost:8081.

## Controles

- ← / →: mover
- ↓: descer mais rápido
- ↑ ou X: girar
- Espaço: queda instantânea
- P: pausar
- R: reiniciar

Os melhores resultados são mantidos em memória enquanto a API estiver rodando.

O jogo também funciona sem a API. Para usar o placar online, informe no campo **Endereço do backend** um endereço acessível pelo navegador (por exemplo, `http://localhost:8080`) e clique em **Conectar**. O endereço fica salvo no navegador.
