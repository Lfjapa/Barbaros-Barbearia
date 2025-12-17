
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { History, LogOut, ArrowLeft, Menu } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';

export function Navbar({ role: propRole }) {
    const { userRole, userData, currentUser, logout } = useAuth();
    const role = propRole || userRole || 'barber'; // Use prop if given (for testing) or context
    const location = useLocation();
    const navigate = useNavigate();
    const isMainPage = location.pathname === '/app' || location.pathname === '/admin';
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <nav className="bg-[var(--color-dark-surface)] border-b border-[var(--color-border)] py-4 px-6 mb-6 relative z-50">
            <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
                {/* Left Side: Menu + Logo + User Identity */}
                <div className="flex items-center gap-3">
                    {/* Admin Hamburger Menu (Left) */}
                    {role === "admin" && (
                        <div className="relative">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`p-1 rounded-lg transition-colors ${isMenuOpen ? 'text-[var(--color-primary)]' : 'text-white hover:text-[var(--color-primary)]'}`}
                            >
                                <Menu size={28} />
                            </button>

                            {/* Dropdown Menu (Left Aligned) */}
                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-[var(--color-dark-surface)] border border-[var(--color-primary)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col animation-fade-in">
                                        <Link
                                            to="/admin"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-5 py-4 text-sm font-bold text-white hover:bg-[var(--color-dark-bg)] hover:text-[var(--color-primary)] transition-colors border-b border-[var(--color-border)] whitespace-nowrap flex items-center gap-2"
                                        >
                                            DASHBOARD
                                        </Link>
                                        <Link
                                            to="/admin/history"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-5 py-4 text-sm font-bold text-white hover:bg-[var(--color-dark-bg)] hover:text-[var(--color-primary)] transition-colors border-b border-[var(--color-border)] whitespace-nowrap flex items-center gap-2"
                                        >
                                            HISTÓRICO
                                        </Link>
                                        <Link
                                            to="/admin/services"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-5 py-4 text-sm font-bold text-white hover:bg-[var(--color-dark-bg)] hover:text-[var(--color-primary)] transition-colors border-b border-[var(--color-border)] whitespace-nowrap flex items-center gap-2"
                                        >
                                            SERVIÇOS
                                        </Link>
                                        <Link
                                            to="/admin/barbers"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-5 py-4 text-sm font-bold text-white hover:bg-[var(--color-dark-bg)] hover:text-[var(--color-primary)] transition-colors border-b border-[var(--color-border)] whitespace-nowrap flex items-center gap-2"
                                        >
                                            EQUIPE
                                        </Link>
                                        <Link
                                            to="/admin/settings"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="px-5 py-4 text-sm font-bold text-white hover:bg-[var(--color-dark-bg)] hover:text-[var(--color-primary)] transition-colors whitespace-nowrap flex items-center gap-2"
                                        >
                                            CONFIGURAÇÕES
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="text-xl font-black tracking-widest text-white uppercase" style={{ fontFamily: 'var(--font-family)' }}>
                        BARBAROS
                    </div>

                    {/* User Identity (Now next to Logo) */}
                    <div className="flex items-center gap-2 ml-2 border-l border-[var(--color-border)] pl-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-yellow-500/20 border border-yellow-400">
                            <span className="text-black font-black text-xs uppercase">
                                {(userData?.name || currentUser?.displayName || 'U').charAt(0)}
                            </span>
                        </div>
                        <div className="hidden md:flex flex-col items-start leading-none">
                            <span className="text-[10px] font-bold text-white uppercase overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]">
                                {(userData?.name || currentUser?.displayName || 'Usuário').split(' ')[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: History + Back + Logout */}
                <div className="flex items-center gap-4">
                    {role === "barber" && isMainPage && (
                        <Link to="/app/history" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors flex flex-col items-center group">
                            <History size={24} className="group-hover:scale-110 transition-transform" />
                        </Link>
                    )}

                    {!isMainPage && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-[var(--color-dark-bg)] text-white transition-colors"
                            aria-label="Voltar"
                        >
                            <ArrowLeft size={24} />
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="mr-2 ml-1 text-white hover:text-[var(--color-error)] transition-colors flex items-center gap-1 group"
                        aria-label="Sair"
                    >
                        <LogOut size={22} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block">SAIR</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

export function Layout({ children, role }) {
    return (
        <div className="min-h-screen pb-10">
            <Navbar role={role} />
            <main className="container">
                {children}
            </main>
        </div>
    );
}
