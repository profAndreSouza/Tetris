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
