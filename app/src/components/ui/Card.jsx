export function Card({ children, className = "", ...props }) {
    return (
        <div
            className={`bg-[var(--color-dark-surface)] p-4 rounded-lg border border-[var(--color-border)] shadow-sm ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}
