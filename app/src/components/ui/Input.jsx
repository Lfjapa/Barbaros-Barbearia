export function Input({ label, id, className = "", ...props }) {
    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label htmlFor={id} className="text-[var(--font-size-sm)] font-medium text-[var(--color-text-secondary)]">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`bg-[#000] border border-[var(--color-border)] rounded-md p-3 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors ${className}`}
                {...props}
            />
        </div>
    );
}
