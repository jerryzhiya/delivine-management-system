// backend/src/controllers/gatewayController.ts
import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import axios from 'axios';

// Initialize Online / Virtual Account Payment (Paystack / Flutterwave example)
export const initializePortalPayment = async (req: Request, res: Response) => {
  const { studentId, amount, email, paymentId } = req.body;

  try {
    const reference = `REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Example API request to Paystack / Flutterwave / Stripe
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: Math.round(amount * 100), // convert to kobo/cents
        reference,
        metadata: { studentId, paymentId },
        callback_url: `${process.env.FRONTEND_URL}/payments/verify`,
      },
      {
        headers: { Authorization: `Bearer ${process.env.PAYMENT_GATEWAY_SECRET_KEY}` },
      }
    );

    return res.status(200).json({
      authorizationUrl: response.data.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    return res.status(500).json({ error: 'Failed to initialize gateway payment' });
  }
};

// Webhook listener for automated status updates (Card payments & Bank Transfers)
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;

    // Verify webhook signature here according to gateway documentation

    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;
      const paidAmount = amount / 100;

      const existingPayment = await prisma.payment.findUnique({
        where: { id: metadata.paymentId },
      });

      if (existingPayment) {
        const totalPaid = existingPayment.amountPaid + paidAmount;
        const status = totalPaid >= existingPayment.totalFee ? 'PAID' : 'PARTIAL';

        await prisma.payment.update({
          where: { id: metadata.paymentId },
          data: {
            amountPaid: totalPaid,
            status,
            reference,
            paymentMethod: 'GATEWAY',
          },
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};