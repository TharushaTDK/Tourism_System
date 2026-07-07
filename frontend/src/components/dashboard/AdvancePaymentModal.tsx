'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Trip } from '@/types';
import { X, Upload } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AdvancePaymentModalProps {
  trip: Trip;
  onClose: () => void;
}

export default function AdvancePaymentModal({ trip, onClose }: AdvancePaymentModalProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('slip', file as File);
      return api.post(`/itineraries/${trip.id}/payment-slip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-itineraries'] });
      toast.success('Payment slip submitted — awaiting verification');
      onClose();
    },
    onError: () => toast.error('Failed to submit payment slip'),
  });

  const handleSubmit = () => {
    if (!file) { toast.error('Please select a payment slip file'); return; }
    submitMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Advance Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-center">
            <p className="text-xs text-sky-700">Trip total</p>
            <p className="text-lg font-bold text-sky-800">{formatCurrency(Number(trip.quoted_price) || 0)}</p>
            <div className="border-t border-sky-200 my-2" />
            <p className="text-xs text-sky-700">Advance due now (20%)</p>
            <p className="text-2xl font-extrabold text-sky-800">{formatCurrency(Number(trip.advance_amount) || 0)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Payment Slip</label>
            <p className="text-xs text-gray-400 mb-2">A photo or PDF of your bank transfer receipt.</p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 cursor-pointer hover:border-blue-400 transition-colors">
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm text-gray-500 text-center px-2 truncate max-w-full">{file ? file.name : 'Click to choose a file'}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <button onClick={handleSubmit} disabled={submitMutation.isPending || !file}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60">
            {submitMutation.isPending ? 'Submitting...' : 'Submit Payment Slip'}
          </button>
        </div>
      </div>
    </div>
  );
}
