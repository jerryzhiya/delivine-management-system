// PaymentOptionsModal.tsx
'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Building2, Copy, Check, ExternalLink } from 'lucide-react';
import { api } from '@/app/lib/api';

interface PaymentOptionsModalProps {
  paymentId: string;
  studentId: string;
  studentEmail: string;
  amountToPay: number;
  onClose?: () => void;
}

export default function PaymentOptionsModal({
  paymentId,
  studentId,
  studentEmail,
  amountToPay = 0,
  onClose,
}: PaymentOptionsModalProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'PORTAL' | 'TRANSFER'>('PORTAL');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const schoolBankDetails = {
    bankName: 'First Bank of Nigeria',
    accountNumber: '3012345678',
    accountName: 'Delivine International Academy',
  };

  const handlePortalPayment = async () => {
    try {
      setLoading(true);
      const res = await api.post('/payments/initialize-gateway', {
        paymentId,
        studentId,
        email: studentEmail,
        amount: amountToPay,
      });

      // Redirect to secure payment gateway page (Card/USSD/Bank Transfer)
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      alert('Failed to launch portal checkout.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    router.back();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5">
        <h3 className="text-lg font-bold text-slate-900">Select Payment Method</h3>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedMethod('PORTAL')}
            className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all ${
              selectedMethod === 'PORTAL'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <span className="font-semibold text-xs sm:text-sm">Pay Online</span>
            <span className="text-[10px] text-slate-500">Cards, USSD, Instant Gateway</span>
          </button>

          <button
            onClick={() => setSelectedMethod('TRANSFER')}
            className={`p-4 rounded-xl border-2 text-left flex flex-col gap-2 transition-all ${
              selectedMethod === 'TRANSFER'
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                : 'border-slate-200 text-slate-600'
            }`}
          >
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span className="font-semibold text-xs sm:text-sm">Bank Transfer</span>
            <span className="text-[10px] text-slate-500">Manual Transfer to School</span>
          </button>
        </div>

        {selectedMethod === 'PORTAL' ? (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600">
              You will be redirected to our secure payment gateway to complete your payment of{' '}
              <strong className="text-slate-900">${amountToPay.toFixed(2)}</strong>.
            </p>
            <button
              onClick={handlePortalPayment}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Proceed to Gateway (${amountToPay.toFixed(2)})
            </button>
          </div>
        ) : (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <p className="font-semibold text-slate-700">School Account Details:</p>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">Bank:</span>
              <span className="font-semibold text-slate-900">{schoolBankDetails.bankName}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">Account Name:</span>
              <span className="font-semibold text-slate-900">{schoolBankDetails.accountName}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500">Account Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {schoolBankDetails.accountNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(schoolBankDetails.accountNumber)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-600"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-2">
              Note: Use the Student's Full Name as the transaction description when making transfers.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleClose}
          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}