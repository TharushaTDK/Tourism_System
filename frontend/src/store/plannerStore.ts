import { create } from 'zustand';
import { CostEstimate } from '@/types';

type Budget = 'budget' | 'mid_range' | 'luxury';

type TravelerGroup = 'adults' | 'children_6_12' | 'children_under_5';

interface PlannerStore {
  step: number;
  arrival_date: string;
  departure_date: string;
  adults: number;
  children_6_12: number;
  children_under_5: number;
  travelers: number;
  budget: Budget;
  interests: string[];
  selected_destinations: number[];
  cost_estimate: CostEstimate | null;
  ai_itinerary: string | null;
  isLoading: boolean;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  pendingSubmit: boolean;

  setStep: (step: number) => void;
  setPlannerField: <K extends keyof Omit<PlannerStore, 'setStep' | 'setPlannerField' | 'setTravelerGroup' | 'toggleDestination' | 'toggleInterest' | 'setCostEstimate' | 'setAIItinerary' | 'resetPlanner' | 'setLoading'>>(key: K, value: PlannerStore[K]) => void;
  setTravelerGroup: (group: TravelerGroup, value: number) => void;
  toggleDestination: (id: number) => void;
  toggleInterest: (interest: string) => void;
  setCostEstimate: (estimate: CostEstimate) => void;
  setAIItinerary: (itinerary: string) => void;
  setLoading: (loading: boolean) => void;
  resetPlanner: () => void;
}

const initialState = {
  step: 1,
  arrival_date: '',
  departure_date: '',
  adults: 2,
  children_6_12: 0,
  children_under_5: 0,
  travelers: 2,
  budget: 'mid_range' as Budget,
  interests: [],
  selected_destinations: [],
  cost_estimate: null,
  ai_itinerary: null,
  isLoading: false,
  contact_email: '',
  contact_phone: '',
  contact_whatsapp: '',
  pendingSubmit: false,
};

export const usePlannerStore = create<PlannerStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setPlannerField: (key, value) => set({ [key]: value } as Partial<PlannerStore>),

  setTravelerGroup: (group, value) =>
    set((state) => {
      const next = { ...state, [group]: value };
      return { [group]: value, travelers: next.adults + next.children_6_12 + next.children_under_5 };
    }),

  toggleDestination: (id) =>
    set((state) => ({
      selected_destinations: state.selected_destinations.includes(id)
        ? state.selected_destinations.filter((d) => d !== id)
        : [...state.selected_destinations, id],
    })),

  toggleInterest: (interest) =>
    set((state) => ({
      interests: state.interests.includes(interest)
        ? state.interests.filter((i) => i !== interest)
        : [...state.interests, interest],
    })),

  setCostEstimate: (estimate) => set({ cost_estimate: estimate }),

  setAIItinerary: (itinerary) => set({ ai_itinerary: itinerary }),

  setLoading: (loading) => set({ isLoading: loading }),

  resetPlanner: () => set(initialState),
}));
