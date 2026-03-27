import { create } from "zustand";

export interface QuizCheckoutFlowState {
  // Dados capturados do Quiz
  quizData: {
    name?: string;
    email?: string;
    phone?: string;
    answers?: Record<string, any>;
    leadScore?: number;
    quizId?: string;
  };

  // Ações
  captureQuizData: (data: Partial<QuizCheckoutFlowState["quizData"]>) => void;
  getCheckoutPrefill: () => {
    name: string;
    email: string;
    phone: string;
  };
  clearQuizData: () => void;
}

/**
 * Zustand Store para automatizar o fluxo de dados do Quiz para o Checkout
 * Captura dados do Quiz e pre-preenche o formulário de Checkout
 */
export const useQuizCheckoutFlow = create<QuizCheckoutFlowState>((set, get) => ({
  quizData: {
    name: "",
    email: "",
    phone: "",
    answers: {},
    leadScore: 0,
    quizId: "",
  },

  captureQuizData: (data: Partial<QuizCheckoutFlowState["quizData"]>) => {
    set(state => ({
      quizData: {
        ...state.quizData,
        ...data,
      },
    }));
  },

  getCheckoutPrefill: () => {
    const { quizData } = get();
    return {
      name: quizData.name || "",
      email: quizData.email || "",
      phone: quizData.phone || "",
    };
  },

  clearQuizData: () => {
    set({
      quizData: {
        name: "",
        email: "",
        phone: "",
        answers: {},
        leadScore: 0,
        quizId: "",
      },
    });
  },
}));
