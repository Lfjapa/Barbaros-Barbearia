export function Button({ children, variant = "primary", className = "", ...props }) {
    const baseStyles = "w-full py-3 px-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md",
        secondary: "bg-[var(--color-dark-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[#2C2C2C]",
        outline: "bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[rgba(212,175,55,0.1)]"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
