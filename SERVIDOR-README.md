# Instruções para configurar o servidor de pagamentos

Para integrar o RunSheet AI Coach com o Stripe e habilitar pagamentos, siga estes passos:

## 1. Configuração das credenciais

1. Abra o arquivo `.env.server` e adicione sua chave secreta do Stripe:
```
PORT=3001
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta_aqui
```

2. Verifique que o arquivo `.env` já contém sua chave publicável e ID de preço:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
VITE_STRIPE_PRICE_ID=price_...
```

## 2. Instalando dependências

Se ainda não tiver instalado, instale as dependências do servidor:

```bash
npm install express cors stripe dotenv
```

## 3. Executando o servidor

Você tem duas opções:

### Opção 1: Usar o arquivo .bat (Windows)
Basta dar um duplo clique no arquivo `iniciar-servidor.bat` 

### Opção 2: Via linha de comando
```bash
node server.js
```

## 4. Testando o servidor

Após iniciar o servidor, confirme que está funcionando acessando:
- http://localhost:3001/health

## 5. Executando o frontend

Em outro terminal, execute o frontend normalmente:
```bash
npm run dev
```

## Possíveis erros e soluções

### Erro: "Checkout ainda não implementado"
- Verifique se o servidor está rodando na porta 3001
- Confira se VITE_API_URL está configurado como "http://localhost:3001" 
- Verifique se VITE_STRIPE_PRICE_ID contém um ID de preço válido

### Erro: "Não foi possível se comunicar com o servidor"
- Certifique-se que o servidor está em execução
- Verifique se há algum firewall bloqueando a porta 3001

### Erro de CORS
- Verifique se o servidor está configurado corretamente com CORS
