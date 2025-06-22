// server.js
// Servidor backend para integração com Stripe e Clerk
// Execute com: node server.js

// Para CommonJS (Node.js padrão)
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const dotenv = require('dotenv');
const path = require('path');
const { clerkClient } = require('@clerk/clerk-sdk-node');

// Carrega variáveis de ambiente do arquivo .env.server se existir
dotenv.config({ path: path.resolve(__dirname, '.env.server') });

const app = express();
const port = process.env.PORT || 3001;

// Inicializa o Stripe com sua chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Inicializa o Clerk (se houver uma chave secreta configurada)
if (process.env.CLERK_SECRET_KEY) {
  console.log("API do Clerk inicializada");
} else {
  console.warn("AVISO: Clerk não está configurado. Adicione CLERK_SECRET_KEY ao seu .env.server");
}

// Log para verificar se as variáveis de ambiente foram carregadas
console.log("API do Stripe inicializada");
console.log("Usando porta:", port);

app.use(cors());
app.use(express.json());

// Middleware para verificar o token JWT do Clerk (opcional, mas recomendado para produção)
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Use este middleware para rotas que precisam de autenticação
// app.use('/api/protected', ClerkExpressRequireAuth(), (req, res) => {...});

// Rota para criar/recuperar um cliente Stripe para um usuário Clerk
app.post('/api/create-stripe-customer', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Tenta obter o usuário do Clerk
    let user;
    try {
      user = await clerkClient.users.getUser(userId);
    } catch (error) {
      return res.status(404).json({ error: 'User not found in Clerk' });
    }
    
    // Verifica se o usuário já tem um ID de cliente Stripe nos metadados
    let stripeCustomerId = user.publicMetadata.stripeCustomerId;
    
    // Se não tiver, cria um novo cliente no Stripe
    if (!stripeCustomerId) {
      // Obtém o email principal do usuário
      const primaryEmail = user.emailAddresses.find(email => 
        email.id === user.primaryEmailAddressId
      )?.emailAddress;
      
      if (!primaryEmail) {
        return res.status(400).json({ error: 'User has no email address' });
      }
      
      // Cria o cliente no Stripe
      const customer = await stripe.customers.create({
        email: primaryEmail,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        metadata: {
          clerkUserId: userId
        }
      });
      
      stripeCustomerId = customer.id;
      
      // Atualiza os metadados do usuário no Clerk com o ID do cliente Stripe
      await clerkClient.users.updateUser(userId, {
        publicMetadata: { 
          ...user.publicMetadata,
          stripeCustomerId 
        }
      });
      
      console.log(`Novo cliente Stripe criado para o usuário ${userId}: ${stripeCustomerId}`);
    }
    
    res.json({ stripeCustomerId });
  } catch (error) {
    console.error('Erro ao criar cliente Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, clerkUserId, successUrl, cancelUrl } = req.body;
    
    console.log('Criando sessão de checkout com:', { priceId, clerkUserId, successUrl, cancelUrl });
    
    if (!priceId) {
      return res.status(400).json({ 
        error: 'Preço não fornecido. Verifique VITE_STRIPE_PRICE_ID no arquivo .env' 
      });
    }
    
    // Validação adicional do priceId
    if (!priceId.startsWith('price_')) {
      console.warn('AVISO: O ID fornecido não parece ser um price_id válido do Stripe:', priceId);
    }
    
    // Busca ou cria o cliente Stripe para o usuário Clerk
    let stripeCustomerId;
    
    if (clerkUserId) {
      try {
        // Obter usuário do Clerk
        const user = await clerkClient.users.getUser(clerkUserId);
        stripeCustomerId = user.publicMetadata.stripeCustomerId;
        
        // Se não tiver um cliente Stripe, criar um
        if (!stripeCustomerId) {
          // Chama o endpoint que criamos para criar um cliente Stripe
          const response = await fetch(`${req.protocol}://${req.get('host')}/api/create-stripe-customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: clerkUserId })
          });
          
          if (!response.ok) {
            throw new Error('Falha ao criar cliente Stripe');
          }
          
          const data = await response.json();
          stripeCustomerId = data.stripeCustomerId;
        }
      } catch (error) {
        console.error('Erro ao obter/criar cliente Stripe:', error);
      }
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
      success_url: successUrl || `${req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
      cancel_url: cancelUrl || `${req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-canceled`,
      metadata: {
        clerkUserId // Armazena o ID do usuário Clerk nos metadados da sessão
      }
    };
    
    // Apenas adiciona o customer se tivermos um ID de cliente válido do Stripe
    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId;
      console.log(`Usando cliente Stripe existente: ${stripeCustomerId}`);
    } else {
      console.log('Criando sessão sem um cliente Stripe associado');
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
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Obter Stripe Customer ID do usuário Clerk
    let stripeCustomerId;
    
    try {
      // Se userId começar com 'user_', é um ID do Clerk
      if (userId.startsWith('user_')) {
        const user = await clerkClient.users.getUser(userId);
        stripeCustomerId = user.publicMetadata.stripeCustomerId;
        
        if (!stripeCustomerId) {
          return res.json({
            active: false,
            subscription: null,
            message: 'User has no associated Stripe customer ID'
          });
        }
      } else {
        // Se não começar com 'user_', assumir que é um ID de cliente do Stripe diretamente
        // (compatibilidade com versões anteriores)
        stripeCustomerId = userId;
      }
      
      // Buscar assinaturas ativas para o cliente
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
        expand: ['data.default_payment_method']
      });
      
      // Se tiver uma assinatura ativa, atualizar os metadados do usuário no Clerk
      if (subscriptions.data.length > 0 && userId.startsWith('user_')) {
        // Armazenar info da assinatura nos metadados do usuário para acesso mais rápido
        await clerkClient.users.updateUser(userId, {
          publicMetadata: { 
            isPremium: true,
            subscriptionId: subscriptions.data[0].id,
            subscriptionStatus: subscriptions.data[0].status,
            subscriptionPeriodEnd: subscriptions.data[0].current_period_end ? 
              new Date(subscriptions.data[0].current_period_end * 1000).toISOString() : 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Fallback para 30 dias
          }
        });
      }
      
      res.json({
        active: subscriptions.data.length > 0,
        subscription: subscriptions.data[0] || null,
      });
    } catch (error) {
      console.error('Error getting user or subscriptions:', error);
      res.status(500).json({ error: error.message });
    }
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

// Endpoint de teste específico para o Stripe
app.get('/stripe-test', (req, res) => {
  res.json({
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    priceId: process.env.STRIPE_PRICE_ID || 'não configurado'
  });
});

// Endpoint para verificar rapidamente se um usuário é premium (usando apenas Clerk)
app.get('/api/user-premium-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || !userId.startsWith('user_')) {
      return res.status(400).json({ error: 'Invalid Clerk user ID' });
    }
    
    // Obter usuário do Clerk com seus metadados
    const user = await clerkClient.users.getUser(userId);
    
    // Verificar se o usuário tem status premium nos metadados
    const isPremium = user.publicMetadata.isPremium === true;
    
    // Se tem metadados de assinatura, verificar se a assinatura expirou
    let subscriptionActive = false;
    let subscriptionData = null;
    
    if (isPremium && user.publicMetadata.subscriptionPeriodEnd) {
      const subscriptionEnd = new Date(user.publicMetadata.subscriptionPeriodEnd);
      const now = new Date();
      
      // Se a data de expiração ainda não chegou, a assinatura está ativa
      subscriptionActive = subscriptionEnd > now;
      
      // Se a assinatura expirou, mas estava marcada como premium, atualizar o status
      if (!subscriptionActive && isPremium) {
        await clerkClient.users.updateUser(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            isPremium: false
          }
        });
      }
      
      subscriptionData = {
        id: user.publicMetadata.subscriptionId,
        status: subscriptionActive ? 'active' : 'expired',
        currentPeriodEnd: user.publicMetadata.subscriptionPeriodEnd
      };
    }
    
    // Se não tiver informações de assinatura nos metadados ou a assinatura expirou,
    // fazer uma verificação completa com o Stripe
    if (!isPremium || !subscriptionActive) {
      const stripeCustomerId = user.publicMetadata.stripeCustomerId;
      
      if (stripeCustomerId) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
            limit: 1
          });
            if (subscriptions.data.length > 0) {
            // Obter a assinatura ativa
            const subscription = subscriptions.data[0];
            
            // Preparar os metadados para atualização
            const metadata = {
              ...user.publicMetadata,
              isPremium: true,
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
            };
            
            // Adicionar a data de término do período apenas se existir
            if (subscription.current_period_end) {
              try {
                metadata.subscriptionPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
              } catch (error) {
                console.log('Aviso: Não foi possível converter a data de expiração da assinatura:', subscription.current_period_end);
              }
            }
            
            // Atualizar metadados do usuário com as informações da assinatura
            await clerkClient.users.updateUser(userId, {
              publicMetadata: metadata
            });
            
            subscriptionActive = true;
            subscriptionData = subscriptions.data[0];
          }
        } catch (error) {
          console.error('Erro ao verificar assinatura no Stripe:', error);
        }
      }
    }
    
    res.json({
      isPremium: isPremium && subscriptionActive,
      subscription: subscriptionData
    });
  } catch (error) {
    console.error('Erro ao verificar status premium do usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de teste para verificar se o servidor está rodando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Servidor RunSheet API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de webhook do Stripe
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // Em produção, você deve definir STRIPE_WEBHOOK_SECRET em .env.server
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  
  // Verificar a assinatura do webhook se um segredo estiver configurado
  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error(`Erro de assinatura do webhook: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Para desenvolvimento, aceitar eventos sem verificação
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      console.error(`Erro ao analisar o evento do webhook: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    console.warn('AVISO: Webhook sendo processado sem verificação de assinatura. Configure STRIPE_WEBHOOK_SECRET em produção.');
  }
  
  // Processar eventos relevantes
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Obter o ID do usuário Clerk dos metadados da sessão
        const clerkUserId = session.metadata?.clerkUserId;
        
        if (clerkUserId && session.customer && session.subscription) {
          // Atualizar metadados do usuário no Clerk
          await clerkClient.users.updateUser(clerkUserId, {
            publicMetadata: {
              isPremium: true,
              stripeCustomerId: session.customer,
              subscriptionId: session.subscription,
              subscriptionStatus: 'active',
              // Buscar o período de expiração real da assinatura
              // Não temos isso diretamente no evento de checkout
              // Isso será atualizado quando processarmos o evento subscription.created
            }
          });
          
          console.log(`Usuário ${clerkUserId} atualizado para premium após checkout`);
        }
        break;
      }
      
      case 'subscription.created':
      case 'subscription.updated': {
        const subscription = event.data.object;
        
        // Buscar o cliente do Stripe
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        // Buscar o ID do usuário Clerk nos metadados do cliente
        const clerkUserId = customer.metadata?.clerkUserId;
        
        if (clerkUserId) {
          // Atualizar metadados do usuário no Clerk
          await clerkClient.users.updateUser(clerkUserId, {
            publicMetadata: {
              isPremium: subscription.status === 'active',
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              subscriptionPeriodEnd: subscription.current_period_end ? 
                new Date(subscription.current_period_end * 1000).toISOString() : 
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Fallback para 30 dias
            }
          });
          
          console.log(`Metadados de assinatura atualizados para o usuário ${clerkUserId}`);
        }
        break;
      }
      
      case 'subscription.deleted': {
        const subscription = event.data.object;
        
        // Buscar o cliente do Stripe
        const customer = await stripe.customers.retrieve(subscription.customer);
        
        // Buscar o ID do usuário Clerk nos metadados do cliente
        const clerkUserId = customer.metadata?.clerkUserId;
        
        if (clerkUserId) {
          // Atualizar metadados do usuário no Clerk
          const user = await clerkClient.users.getUser(clerkUserId);
          
          await clerkClient.users.updateUser(clerkUserId, {
            publicMetadata: {
              ...user.publicMetadata,
              isPremium: false,
              subscriptionStatus: 'canceled'
            }
          });
          
          console.log(`Status premium removido para o usuário ${clerkUserId}`);
        }
        break;
      }
      
      // Você pode adicionar mais handlers de eventos aqui conforme necessário
      
      default:
        // Registro silencioso de outros eventos não processados
        console.log(`Evento não processado: ${event.type}`);
    }
    
    res.json({received: true});
  } catch (error) {
    console.error(`Erro ao processar webhook: ${error.message}`);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Servidor RunSheet rodando em http://localhost:${port}`);
  console.log(`Teste o servidor acessando: http://localhost:${port}/health`);
});
