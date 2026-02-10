import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, senha);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
        'E-mail ou senha inválidos.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 380,
          background: '#fff',
          borderRadius: 16,
          padding: '36px 32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            Bem-vindo 👋
          </h1>
          <p style={{ marginTop: 8, color: '#6b7280', fontSize: 15 }}>
            Acesse o sistema para continuar
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: 12,
              borderRadius: 8,
              background: '#fee2e2',
              color: '#991b1b',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* CONTAINER PADRÃO */}
        <div
          style={{
            width: '100%',
            maxWidth: 320,
            margin: '0 auto',
          }}
        >
          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                fontSize: 14,
                color: '#111827',
                outline: 'none',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.border = '1px solid #2563eb')
              }
              onBlur={(e) =>
                (e.currentTarget.style.border = '1px solid #d1d5db')
              }
            />
          </div>

          {/* Senha */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 500,
                color: '#374151',
              }}
            >
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #d1d5db',
                background: '#ffffff',
                fontSize: 14,
                color: '#111827',
                outline: 'none',
              }}
              onFocus={(e) =>
                (e.currentTarget.style.border = '1px solid #2563eb')
              }
              onBlur={(e) =>
                (e.currentTarget.style.border = '1px solid #d1d5db')
              }
            />
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: loading ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </div>

        {/* Rodapé */}
        <div
          style={{
            marginTop: 28,
            textAlign: 'center',
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          © {new Date().getFullYear()} • Sistema de Contratos
        </div>
      </form>
    </div>
  );
}
