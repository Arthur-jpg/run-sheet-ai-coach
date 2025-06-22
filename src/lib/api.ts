// API service for handling Stripe operations
import { loadStripe } from '@stripe/stripe-js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface ClientData {
  name: string;
  email: string;
  id?: string;
}

export interface RunningPlan {
  id: string;
  title: string;
  clientId: string;
  content: string;
  createdAt: string;
}

export const stripe = {
  // Create a checkout session for subscription
  createCheckoutSession: async (priceId: string, clerkUserId?: string) => {
    try {
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          priceId,
          clerkUserId, // Agora enviamos o ID do Clerk em vez do customerId
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Server error: ${errorData.error || response.statusText}`);
      }

      const { id } = await response.json();
      if (!id) {
        throw new Error('Failed to receive session ID from server');
      }
      
      // Get Stripe.js instance
      const stripe = await stripePromise;
      
      // Redirect to Checkout
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId: id });
        
        if (error) {
          console.error('Error redirecting to checkout:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Criar ou recuperar um cliente Stripe para um usuário Clerk
  createStripeCustomer: async (clerkUserId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/create-stripe-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: clerkUserId }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar/recuperar cliente Stripe');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao criar/recuperar cliente Stripe:', error);
      throw error;
    }
  },

  // Get subscription status for a Clerk user
  getSubscriptionStatus: async (clerkUserId: string) => {
    try {
      const response = await fetch(`${API_URL}/subscription-status/${clerkUserId}`);
      return await response.json();
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return { active: false };
    }
  },
  
  // Verificar rapidamente se um usuário é premium (usando metadados do Clerk)
  checkPremiumStatus: async (clerkUserId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/user-premium-status/${clerkUserId}`);
      return await response.json();
    } catch (error) {
      console.error('Error checking premium status:', error);
      return { isPremium: false };
    }
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId: string) => {
    try {
      const response = await fetch(`${API_URL}/cancel-subscription/${subscriptionId}`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  },
};

export const clients = {
  // Create a new client
  createClient: async (clientData: ClientData) => {
    try {
      const response = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  // Get all clients
  getClients: async (coachId: string) => {
    try {
      const response = await fetch(`${API_URL}/clients?coachId=${coachId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  },

  // Update client
  updateClient: async (clientId: string, clientData: Partial<ClientData>) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // Delete client
  deleteClient: async (clientId: string) => {
    try {
      await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'DELETE',
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },
};

export const runningPlans = {
  // Create a new running plan
  createPlan: async (clientId: string, planData: Omit<RunningPlan, 'id' | 'clientId' | 'createdAt'>) => {
    try {
      const response = await fetch(`${API_URL}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...planData, clientId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  // Get all plans for a client
  getClientPlans: async (clientId: string) => {
    try {
      const response = await fetch(`${API_URL}/plans?clientId=${clientId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting plans:', error);
      return [];
    }
  },

  // Get all plans for a coach
  getCoachPlans: async (coachId: string) => {
    try {
      const response = await fetch(`${API_URL}/plans?coachId=${coachId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting coach plans:', error);
      return [];
    }
  },

  // Delete plan
  deletePlan: async (planId: string) => {
    try {
      await fetch(`${API_URL}/plans/${planId}`, {
        method: 'DELETE',
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  },
};
