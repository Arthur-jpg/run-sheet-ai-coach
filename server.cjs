// server.js
// Servidor backend para integração com Stripe
// Execute com: node server.js

// Para CommonJS (Node.js padrão)
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const dotenv = require('dotenv');
const path = require('path');

// Carrega variáveis de ambiente do arquivo .env.server se existir
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

const app = express();
const port = process.env.PORT || 3001;

// Inicializa o Stripe com sua chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Log para verificar se as variáveis de ambiente foram carregadas
console.log("API do Stripe inicializada");
console.log("Usando porta:", port);

app.use(cors());
app.use(express.json());

// Create a checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, customerId, successUrl, cancelUrl } = req.body;
    
    console.log('Criando sessão de checkout com:', { priceId, successUrl, cancelUrl });
    
    if (!priceId) {
      return res.status(400).json({ 
        error: 'Preço não fornecido. Verifique VITE_STRIPE_PRICE_ID no arquivo .env' 
      });
    }
    
    // Validação adicional do priceId
    if (!priceId.startsWith('price_')) {
      console.warn('AVISO: O ID fornecido não parece ser um price_id válido do Stripe:', priceId);
    }
    
    // Cria um objeto de configuração da sessão
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.origin || 'http://localhost:5173'}/payment-success`,
      cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:5173'}/payment-canceled`,
    };
    
    // Apenas adiciona o customer se for fornecido
    if (customerId && customerId !== 'user_123') {
      sessionConfig.customer = customerId;
    }
    
    // Cria a sessão com a configuração
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    console.log('Sessão criada com sucesso:', session.id);
    console.log('URL de checkout:', session.url);
    
    // Responde com o ID da sessão
    res.status(200).json({ id: session.id });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: `Error creating checkout session: ${error.message}` });
  }
});

// Check subscription status
app.get('/subscription-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // In a real app, you'd look up the customer ID using userId
    // For now, assume userId is the customer ID in Stripe
    
    const subscriptions = await stripe.subscriptions.list({
      customer: userId,
      status: 'active',
      limit: 1,
    });
    
    res.json({
      active: subscriptions.data.length > 0,
      subscription: subscriptions.data[0] || null,
    });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
app.post('/cancel-subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    
    res.json({ success: true, subscription: canceledSubscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Client endpoints
let clients = [];
let plans = [];

app.post('/clients', (req, res) => {
  const client = { 
    id: `client_${Date.now()}`, 
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  res.json(client);
});

app.get('/clients', (req, res) => {
  const { coachId } = req.query;
  // In a real app, you'd filter by coach ID
  res.json(clients);
});

app.patch('/clients/:clientId', (req, res) => {
  const { clientId } = req.params;
  const clientIndex = clients.findIndex(c => c.id === clientId);
  
  if (clientIndex !== -1) {
    clients[clientIndex] = { ...clients[clientIndex], ...req.body };
    res.json(clients[clientIndex]);
  } else {
    res.status(404).json({ error: 'Client not found' });
  }
});

app.delete('/clients/:clientId', (req, res) => {
  const { clientId } = req.params;
  clients = clients.filter(c => c.id !== clientId);
  res.json({ success: true });
});

// Running plans endpoints
app.post('/plans', (req, res) => {
  const plan = {
    id: `plan_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  plans.push(plan);
  res.json(plan);
});

app.get('/plans', (req, res) => {
  const { clientId, coachId } = req.query;
  
  if (clientId) {
    res.json(plans.filter(p => p.clientId === clientId));
  } else if (coachId) {
    // In a real app, you'd look up all clients of this coach
    // and then find their plans
    res.json(plans);
  } else {
    res.json(plans);
  }
});

app.delete('/plans/:planId', (req, res) => {
  const { planId } = req.params;
  plans = plans.filter(p => p.id !== planId);  res.json({ success: true });
});

// Endpoint de teste para verificar se o servidor está rodando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Servidor RunSheet API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de teste específico para o Stripe
app.get('/stripe-test', (req, res) => {
  res.json({
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    priceId: process.env.STRIPE_PRICE_ID || 'não configurado'
  });
});

// Endpoint de teste de checkout - usa um preço de teste do Stripe
// Suporta tanto GET quanto POST para facilitar o teste
app.all('/test-checkout', async (req, res) => {
  try {
    console.log('Teste de checkout iniciado via:', req.method);
    
    // Cria uma sessão de checkout simples (sem cliente) usando o Stripe API
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'RunSheet Premium (Teste)',
              description: 'Assinatura de teste - não será cobrado',
            },
            unit_amount: 2990, // R$ 29.90 em centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/payment-success`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/payment-canceled`,
    });

    console.log('Sessão de teste criada:', session.id);
    console.log('URL de checkout:', session.url);
    
    // Redireciona para o checkout
    res.redirect(303, session.url);
  } catch (error) {
    console.error('Erro ao criar sessão de teste:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor RunSheet rodando em http://localhost:${port}`);
  console.log(`Teste o servidor acessando: http://localhost:${port}/health`);
});
