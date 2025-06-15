
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentOptions {
  amount: number;
  currency: string;
  planType: 'monthly' | 'yearly';
  userEmail: string;
  userName: string;
}

export const initializeRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (options: PaymentOptions) => {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: {
      amount: options.amount,
      currency: options.currency,
      planType: options.planType,
    },
  });

  if (error) throw error;
  return data;
};

export const processPayment = async (options: PaymentOptions): Promise<boolean> => {
  try {
    // Initialize Razorpay
    const isRazorpayLoaded = await initializeRazorpay();
    if (!isRazorpayLoaded) {
      throw new Error('Razorpay SDK failed to load');
    }

    // Create order
    const order = await createRazorpayOrder(options);

    return new Promise((resolve, reject) => {
      const razorpayOptions = {
        key: 'rzp_live_47mpRvV2Yh9XLZ', // Your live Razorpay key
        amount: order.amount,
        currency: order.currency,
        name: 'CareerBoost AI',
        description: `${options.planType === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
        order_id: order.id,
        prefill: {
          name: options.userName,
          email: options.userEmail,
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const { error } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType: options.planType,
              },
            });

            if (error) throw error;
            resolve(true);
          } catch (error) {
            console.error('Payment verification failed:', error);
            reject(error);
          }
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled'));
          },
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    });
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
};
