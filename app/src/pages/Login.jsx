import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Scissors } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            // Role check handled by PrivateRoute or explicit check here if needed?
            // Since context updates, we can just navigate to root and let logic handle, 
            // BUT better to be explicit:
            // We can't easily get role from 'login' result without fetching doc again or relying on context update.
            // Relying on PrivateRoute to redirect from '/' might be cleaner, 
            // but let's try navigating to a neutral place or checking context.
            // Actually, the simplest is to navigate to '/' and let the root redirect handle it?
            // No, root redirects to login. 
            // Let's assume standard flow:
            navigate('/app'); // PrivateRoute will redirect to /admin if role is admin
        } catch (err) {
            console.error(err);
            setError('Falha no login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-dark-bg)] relative overflow-hidden">
            {/* Background Decor - Subtle Glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-[var(--color-primary)] rounded-full mix-blend-screen filter blur-[150px] opacity-10 animate-pulse"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 relative">
                    {!imageError ? (
                        <div className="relative inline-block group">
                            <div className="absolute inset-0 bg-[var(--color-primary)] opacity-20 blur-3xl rounded-full group-hover:opacity-30 transition-opacity duration-700"></div>
                            <img 
                                src="/logo-barbaros.png" 
                                alt="Barbaros Barbearia" 
                                className="w-full max-w-[420px] mx-auto relative z-10 drop-shadow-2xl rounded-2xl border border-white/5 animate-fade-in"
                                onError={() => setImageError(true)}
                            />
                        </div>
                    ) : (
                        <>
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[var(--color-dark-surface)] border-2 border-[var(--color-primary)] mb-6 shadow-[0_0_40px_rgba(212,175,55,0.3)]">
                                <Scissors className="w-12 h-12 text-[var(--color-primary)]" />
                            </div>
                            <h1 className="text-4xl font-black tracking-[0.2em] text-white uppercase mb-2" style={{ fontFamily: 'var(--font-family)' }}>
                                Barbaros <span className="text-[var(--color-primary)]">Barbearia</span>
                            </h1>
                        </>
                    )}
                </div>

                <div className="bg-[var(--color-dark-surface)]/90 backdrop-blur-2xl p-8 rounded-3xl border border-[var(--color-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] ml-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-[var(--color-dark-bg)] border border-[var(--color-border)] text-white p-4 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder-gray-700 shadow-inner"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.2em] ml-2">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-[var(--color-dark-bg)] border border-[var(--color-border)] text-white p-4 rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all placeholder-gray-700 shadow-inner"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 text-sm font-black uppercase tracking-[0.15em] shadow-[0_10px_30px_rgba(212,175,55,0.15)] hover:shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-[var(--color-primary)] to-[#b8952f] text-black rounded-xl"
                        >
                            {loading ? 'Aguarde...' : 'Entrar no Sistema'}
                        </Button>
                    </form>

                    <div className="my-8 flex items-center gap-4 opacity-20">
                        <div className="h-px bg-white flex-1"></div>
                        <span className="text-xs font-medium uppercase text-white">Ou acesso rápido</span>
                        <div className="h-px bg-white flex-1"></div>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={async () => {
                            try {
                                setLoading(true);
                                await loginWithGoogle();
                                navigate('/app');
                            } catch (error) {
                                console.error("Google Login Error:", error);
                                // Show specific error for debugging
                                setError(`Erro: ${error.code} - ${error.message}`);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full h-14 border border-[var(--color-border)] hover:bg-white hover:text-black hover:border-white transition-all duration-300 group flex items-center justify-center gap-3 bg-transparent text-white"
                    >
                        {/* Properly sized Google SVG */}
                        <div className="w-6 h-6 min-w-[24px] flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-5 h-5 transition-transform group-hover:scale-110">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        </div>
                        <span className="font-bold tracking-wide text-sm">Entrar com Google</span>
                    </Button>
                </div>

                <p className="mt-8 text-center text-xs text-[var(--color-text-secondary)] opacity-50">
                    &copy; {new Date().getFullYear()} Barbaros Barbearia. Todos os direitos reservados.
                </p>
            </div>
        </div>
    );
}
