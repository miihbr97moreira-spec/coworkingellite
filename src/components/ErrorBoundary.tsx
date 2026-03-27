import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatórios de erro
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback personalizada
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: 'red', border: '1px solid red', margin: '20px' }}>
          <h1>Ocorreu um erro inesperado.</h1>
          <p>Por favor, tente novamente mais tarde. Se o problema persistir, entre em contato com o suporte.</p>
          {this.state.error && (
            <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
              <summary>Detalhes do Erro</summary>
              <p>{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre>{this.state.errorInfo.componentStack}</pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
