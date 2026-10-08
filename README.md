# AdotaPet Web

Frontend React + TypeScript + Vite para o backend Spring Boot deste repositório. A aplicação está em `frontend/` para coexistir com o código Java em `src/`.

## Executar

Requer Node.js 20 ou superior. Inicie o backend e as dependências dele conforme o README da raiz; depois:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

O proxy Vite encaminha `/api/*` para `http://localhost:8080/*`, evitando CORS no desenvolvimento. Para outra URL, defina `BACKEND_URL` no `.env`. Em produção, configure `VITE_API_BASE_URL` para um caminho servido no mesmo domínio pelo proxy reverso ou para uma origem cujo backend permita CORS; o backend atual não configura CORS.

`npm run build` gera a aplicação em `frontend/dist`.

## Contrato do backend mapeado

### Autenticação e sessão

| Método e rota | Acesso | Entrada e resposta |
|---|---|---|
| `POST /auth/login` | Público | `{ email, senha }` → `200 { name, token }` |
| `POST /auth/register` | Público | Dados do abrigo e `endereco` aninhado → `200 { name, token }` |
| `POST /auth/request-password-reset` | Público | `{ email }` → `201`, sem corpo |
| `POST /auth/resetpassword/?id={uuid}&hash={codigo}` | Público | `{ newPassword, confirmPassword }` → `201`, sem corpo |

O token JWT é enviado como `Authorization: Bearer <token>`, é stateless e expira em duas horas. Não existe endpoint de logout, refresh ou consulta de sessão; o logout limpa o token no navegador, e a expiração local é lida da claim `exp`. O reset só pode ser concluído com o `id` e o código que o backend envia pelo fluxo de e-mail/Kafka.

O único perfil criado pela API é o abrigo autenticado (`ROLE_USER`); não há outros papéis ou permissões por função. As telas privadas redirecionam usuários sem sessão, e o backend continua sendo a autoridade de autorização.

### Abrigos

| Método e rota | Acesso | Entrada e resposta |
|---|---|---|
| `GET /abrigo` | JWT | Perfil do abrigo autenticado: dados públicos, status, data de cadastro e endereço |
| `GET /abrigo/{identifier}` | Público | Perfil por UUID |
| `PUT /abrigo/editar` | JWT | `nome`, `email`, `telefone`, `cnpj`, `horarioFuncionamento`, `descricao`, `fotoUrl`; retorna o perfil atualizado |
| `GET /abrigo/proximos` | Público | `latitude`, `longitude` obrigatórios; `raio` em km (default 10), `page` (default 0), `size` (default 10, máximo 100) → `Page<AbrigoInfoResponse>` |

O endpoint de atualização do abrigo não aceita endereço. O frontend mostra o endereço como somente leitura. O endpoint de perfil não retorna o UUID do abrigo nem suas coordenadas.

### Pets

| Método e rota | Acesso | Entrada e resposta |
|---|---|---|
| `GET /pet` | Público | Lista não paginada de `PetInfoResponse` |
| `GET /pet/{identifier}` | Público | Pet por UUID → `PetResponse` |
| `GET /pet/filtros` | Público | Filtros opcionais `nome`, `especie`, `raca`, `idadeEstimadaMeses`, `peso`, `status`, `sexo`, `porte`; paginação `page` (0+) e `size` (1–100) → `Page<PetResponse>` |
| `POST /pet/novo` | JWT | `nome`, `especie`, `raca`, `descricao`, `idadeEstimadaMeses`, `peso`, `fotoUrl`, `status`, `sexo`, `porte` → `200 PetResponse` |
| `PUT /pet/{identifier}/editar` | JWT | Mesmo corpo de cadastro → `200 PetResponse`; somente o abrigo proprietário pode alterar |
| `DELETE /pet/{identifier}/remover` | JWT | UUID → `204`; somente o abrigo proprietário pode remover |

Estados de pet: `DISPONIVEL`, `ADOTADO`, `INDISPONIVEL`; sexo: `MACHO`, `FEMEA`; porte: `PEQUENO`, `MEDIO`, `GRANDE`. Idade aceita zero ou mais meses; peso, quando informado, deve ser positivo. O filtro textual usa `LIKE`; por isso a busca por nome envia curingas `%termo%`. Fotos são URLs (`fotoUrl`), não uploads.

### Adotantes

| Método e rota | Acesso | Entrada e resposta |
|---|---|---|
| `GET /adotante` | Público | `page` (default 0), `size` (default 10; máximo 100) → `Page<AdotanteResponse>` |
| `GET /adotante/{adotanteId}` | Público | UUID → `AdotanteResponse` |
| `POST /adotante/novo` | JWT | `nome`, `email`, `telefone`, `dataNascimento` (`yyyy-MM-dd` ou nulo) → `200 AdotanteResponse` |
| `PUT /adotante/{adotanteId}` | JWT | Mesmo corpo → `200 AdotanteResponse` |
| `DELETE /adotante/{adotanteId}` | JWT | UUID → `204`; pode conflitar com adoções vinculadas |

A API não oferece filtros, busca ou ordenação para adotantes; a interface usa paginação. O e-mail é único no banco. `telefone` é obrigatório pela restrição do banco mesmo sem `@NotBlank` no DTO.

### Adoções

| Método e rota | Acesso | Entrada e resposta |
|---|---|---|
| `GET /adocao` | JWT | Adoções do abrigo autenticado, `page` (default 0), `size` (default 10, máximo 100) → `Page<AdocaoResponse>` ordenada por data decrescente |
| `GET /adocao/{id}` | JWT | UUID, restrito ao abrigo autenticado → `AdocaoResponse` |
| `POST /adocao` | JWT | `{ petId, adotanteId, dataAdocao?, observacoes? }` → `201 AdocaoResponse` |
| `PUT /adocao/{id}` | JWT | `{ adotanteId, dataAdocao, observacoes? }` → `200 AdocaoResponse` |
| `PATCH /adocao/{id}/encerrar` | JWT | Corpo opcional `{ dataEncerramento?, motivoEncerramento? }` → `200 AdocaoResponse` |
| `DELETE /adocao/{id}` | JWT | UUID → `204` |

Estados de adoção: `ATIVA` e `ENCERRADA`. Ao registrar, a data padrão é hoje e o pet precisa estar disponível e pertencer ao abrigo autenticado. A data não pode ser futura. Ao encerrar, a data padrão é hoje e deve estar entre a data da adoção e hoje; o pet volta a `DISPONIVEL`. Excluir uma adoção ativa também pode reabrir o pet. A API não fornece filtro nem ordenação configurável.

### Modelos e relacionamentos

- `Abrigo` tem um `Endereco`; `Pet` pertence a um `Abrigo`.
- `Adocao` relaciona um `Abrigo`, um `Pet` e um `Adotante`.
- `RegistroSaude` relaciona-se a `Pet`, com tipos `VACINA`, `CASTRACAO`, `VERMIFUGACAO`, `CONSULTA`, `TRATAMENTO`, `OUTRO`; não há controller nem endpoints para consultar ou gerenciar esses registros.
- Listagens paginadas seguem o formato Spring `Page` (`content`, `number`, `size`, `totalElements`, `totalPages`, `first`, `last`, `empty`).

### Erros e limites funcionais identificados

Erros do backend usam `{ timestamp, status, error, code, message, path, details }`. Validação, parâmetros inválidos e paginação retornam `400`; autenticação `401`; autorização `403`; recursos ausentes `404`; conflito de dados/estado `409`; exceções não tratadas `500`. A interface traduz esses erros para mensagens úteis e apresenta detalhes de validação quando disponíveis. Tratamentos para `422` e `429` são defensivos no cliente; não há handlers específicos desses status no backend atual.

O backend não possui endpoints para dashboard agregado, gestão de registros de saúde, upload/download de arquivos, recuperação de senha por SMS, filtros de adoções/adotantes ou edição de endereço. As métricas mostradas são somente os totais que podem ser derivados das respostas reais de pets disponíveis e das adoções do abrigo autenticado. A busca por proximidade exige coordenadas fornecidas pelo usuário ou permissão de localização do navegador.
