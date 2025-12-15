import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Scissors } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const { user } = await login(email, password);
            // AuthProvider handles fetching role, but we can check here or just navigate
            // Initial simple navigation, AuthContext state will redirect or update UI
            navigate('/app');
        } catch (err) {
            console.error(err);
            setError('Falha no login. Verifique email e senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-dark-bg)]">
            <Card className="w-full max-w-sm text-center border-[var(--color-primary)]">
                <div className="flex justify-center mb-4 text-[var(--color-primary)]">
                    <Scissors size={48} />
                </div>
                <h1 className="text-2xl font-bold mb-2">BILU BARBER</h1>
                <p className="text-[var(--color-text-secondary)] mb-8">Sistema de Gestão</p>

                {error && <div className="mb-4 text-xs text-red-500 bg-red-100 p-2 rounded">{error}</div>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        placeholder="Email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        placeholder="Senha"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div className="my-4 flex items-center gap-2 opacity-50">
                    <div className="h-px bg-gray-500 flex-1"></div>
                    <span className="text-xs">OU</span>
                    <div className="h-px bg-gray-500 flex-1"></div>
                </div>

                <Button
                    variant="outline"
                    onClick={async () => {
                        try {
                            setLoading(true);
                            await loginWithGoogle();
                            navigate('/app');
                        } catch (error) {
                            console.error("Google Login Error:", error);
                            // Show detailed error to help user debug
                            setError(`Erro Google: ${error.code || error.message}`);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="flex justify-center items-center gap-2"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Entrar com Google
                </Button>
            </Card>
        </div>
    );
}
