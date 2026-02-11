export default function PtytschIcon({ className, color = "currentColor" }: { className?: string; color?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M6 20 L14 10 L16 14 L26 8 L20 16 L22 18 L10 22 Z"
                fill={color}
            />
        </svg>
    );
}
