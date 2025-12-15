import { Link, useLocation } from 'react-router-dom';
import { Scissors, LayoutDashboard, History, LogOut, User } from 'lucide-react';

export function Navbar({ role = "barber" }) {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;
    const linkClass = (path) =>
        `flex flex-col items-center gap-1 p-2 text-xs transition-colors hover:text-[var(--color-primary)] ${isActive(path) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`;

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-[var(--color-dark-surface)] border-t border-[var(--color-border)] py-3 px-6 z-50 backdrop-blur-md bg-opacity-95">
            <div className="flex justify-between items-center max-w-lg mx-auto">

                {role === "barber" && (
                    <>
                        <Link to="/app" className={linkClass('/app')}>
                            <Scissors size={24} />
                            <span>Nova Venda</span>
                        </Link>
                        <Link to="/app/history" className={linkClass('/app/history')}>
                            <History size={24} />
                            <span>Histórico</span>
                        </Link>
                    </>
                )}

                {role === "admin" && (
                    <>
                        <Link to="/admin" className={linkClass('/admin')}>
                            <LayoutDashboard size={24} />
                            <span>Dashboard</span>
                        </Link>
                        <Link to="/admin/services" className={linkClass('/admin/services')}>
                            <Scissors size={24} />
                            <span>Serviços</span>
                        </Link>
                        {/* Added Barbers link for easier access */}
                        <Link to="/admin/barbers" className={linkClass('/admin/barbers')}>
                            <User size={24} />
                            <span>Equipe</span>
                        </Link>
                    </>
                )}

                <button
                    onClick={() => window.location.reload()} // Forcing simple logout/reload or use context logout
                    className="flex flex-col items-center gap-1 p-2 text-xs text-[var(--color-error)] hover:opacity-80"
                    aria-label="Sair do sistema"
                >
                    <LogOut size={24} />
                    <span>Sair</span>
                </button>
            </div>
        </nav>
    );
}

export function Layout({ children, role }) {
    return (
        <div className="pb-20 min-h-screen">
            <main className="container pt-6">
                {children}
            </main>
            <Navbar role={role} />
        </div>
    );
}
