'use client';

import { Trip } from '@/types';
import {
  Calendar, DollarSign, X, Clock, Mail, Phone, MessageCircle,
  ChevronDown, ChevronUp, CheckCircle2, Share2,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateRange, getStatusColor, formatStatusLabel } from '@/lib/utils';

interface TripCardProps {
  trip: Trip;
  expanded: boolean;
  onToggleExpand: () => void;
  onShare: () => void;
  onDelete: () => void;
  onPay: () => void;
}

export default function TripCard({ trip: t, expanded, onToggleExpand, onShare, onDelete, onPay }: TripCardProps) {
  const range = t.trip_details?.cost_estimate?.total;
  const isApproved = ['approved', 'planned', 'active', 'completed'].includes(t.status);
  const isWaiting = t.status === 'pending_approval' || t.status === 'price_set';

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <h3 className="font-bold text-gray-800">{t.title}</h3>
            {t.ai_generated && <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Auto-Generated</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(t.status)}`}>{formatStatusLabel(t.status)}</span>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
            {t.start_date && t.end_date && (
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-blue-500" /> {formatDateRange(t.start_date, t.end_date)}</span>
            )}
            <span>{t.total_days} days</span>
            {range ? (
              <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-blue-500" /> Approx. {formatCurrency(range.low)} – {formatCurrency(range.high)}</span>
            ) : t.estimated_cost ? (
              <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-blue-500" /> Est. {formatCurrency(Number(t.estimated_cost))}</span>
            ) : null}
          </div>

          {t.trip_details?.destination_names?.length ? (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {t.trip_details.destination_names.map((name) => (
                <span key={name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{name}</span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
            {t.contact_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {t.contact_email}</span>}
            {t.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {t.contact_phone}</span>}
            {t.contact_whatsapp && <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {t.contact_whatsapp}</span>}
          </div>

          {isWaiting && (
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 flex items-center gap-1.5 mt-2">
              <Clock className="w-3.5 h-3.5 shrink-0" /> Waiting for our team&apos;s approval — you&apos;ll be contacted within a few hours.
            </p>
          )}

          {t.status === 'quoted' && (
            <div className="mt-2 bg-sky-50 border border-sky-100 rounded-lg px-3 py-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-sky-700 font-medium">Your exact trip price</p>
                  <p className="text-lg font-bold text-sky-800">{formatCurrency(Number(t.quoted_price) || 0)}</p>
                  <p className="text-xs text-sky-600">Advance payment due now (20%): {formatCurrency(Number(t.advance_amount) || 0)}</p>
                </div>
                <button onClick={onPay} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-sky-700 shrink-0">
                  Proceed to Advance Payment
                </button>
              </div>
            </div>
          )}

          {t.status === 'payment_submitted' && (
            <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 flex items-center gap-1.5 mt-2">
              <Clock className="w-3.5 h-3.5 shrink-0" /> Payment slip submitted{t.advance_payment_submitted_at ? ` on ${formatDate(t.advance_payment_submitted_at)}` : ''} — awaiting verification.
            </p>
          )}

          {isApproved && t.advance_amount ? (
            <p className="text-xs text-green-700 mt-1">✅ Advance paid: {formatCurrency(Number(t.advance_amount))}</p>
          ) : null}

          {isApproved && t.notes && (
            <div className="mt-2">
              <button onClick={onToggleExpand} className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {expanded ? 'Hide' : 'View'} Full Itinerary {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {expanded && (
                <div className="bg-blue-50 rounded-xl p-4 mt-2">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">{t.notes}</pre>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onShare} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Share">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
