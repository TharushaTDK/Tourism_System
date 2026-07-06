'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface PlanTripLinkProps {
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}

// Sends logged-out visitors to /login first so they land back on /planner right after signing in,
// instead of wherever a normal login would otherwise redirect them.
export default function PlanTripLink({ className, children, onNavigate }: PlanTripLinkProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleClick = () => {
    onNavigate?.();
    if (!isAuthenticated) {
      toast('Please login for plan a trip', { icon: '🔒' });
      router.push('/login?next=/planner');
      return;
    }
    router.push('/planner');
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
