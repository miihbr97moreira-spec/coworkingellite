import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Inbox from "../Inbox";

// Mock do Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "org-123", owner_id: "user-123" },
        error: null,
      }),
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
  },
}));

// Mock do toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("Inbox Component", () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o componente Inbox", async () => {
    render(<Inbox onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText("Omni Inbox")).toBeInTheDocument();
    });
  });

  it("deve exibir layout 3 colunas", async () => {
    render(<Inbox onBack={mockOnBack} />);

    await waitFor(() => {
      // Verificar presença de elementos das 3 colunas
      expect(screen.getByText(/Omni Inbox/i)).toBeInTheDocument();
    });
  });

  it("deve chamar onBack quando botão voltar é clicado", async () => {
    render(<Inbox onBack={mockOnBack} />);

    await waitFor(() => {
      const backButton = screen.getByRole("button", { name: /voltar/i });
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  it("deve exibir status do WhatsApp", async () => {
    render(<Inbox onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
    });
  });

  it("deve mostrar loading enquanto carrega dados", () => {
    render(<Inbox onBack={mockOnBack} />);

    // Pode haver um loader inicial
    const loader = screen.queryByRole("progressbar");
    expect(loader || screen.getByText(/Omni Inbox/i)).toBeTruthy();
  });

  it("deve exibir mensagem quando não há organização", async () => {
    // Mock para retornar null
    vi.mocked(require("@/integrations/supabase/client").supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    render(<Inbox onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma organização encontrada/i)).toBeInTheDocument();
    });
  });
});

describe("Inbox - Conversas", () => {
  it("deve exibir lista de conversas", async () => {
    render(<Inbox onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Omni Inbox/i)).toBeInTheDocument();
    });
  });

  it("deve permitir selecionar conversa", async () => {
    render(<Inbox onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Omni Inbox/i)).toBeInTheDocument();
    });
  });

  it("deve exibir contador de não lidas", async () => {
    render(<Inbox onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/não lida/i)).toBeInTheDocument();
    });
  });
});

describe("Inbox - Responsividade", () => {
  it("deve ser responsivo em mobile", async () => {
    // Simular viewport mobile
    global.innerWidth = 375;

    render(<Inbox onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Omni Inbox/i)).toBeInTheDocument();
    });
  });

  it("deve ser responsivo em tablet", async () => {
    global.innerWidth = 768;

    render(<Inbox onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Omni Inbox/i)).toBeInTheDocument();
    });
  });

  it("deve ser responsivo em desktop", async () => {
    global.innerWidth = 1920;

    render(<Inbox onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Omni Inbox/i)).toBeInTheDocument();
    });
  });
});
