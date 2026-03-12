'use client';

export function CarouselPrev({ trackId }: { trackId: string }) {
    return (
        <button
            className="carousel-nav-btn"
            aria-label="Scroll left"
            onClick={() => {
                const el = document.getElementById(trackId);
                if (el) el.scrollBy({ left: -420, behavior: 'smooth' });
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
    );
}

export function CarouselNext({ trackId }: { trackId: string }) {
    return (
        <button
            className="carousel-nav-btn"
            aria-label="Scroll right"
            onClick={() => {
                const el = document.getElementById(trackId);
                if (el) el.scrollBy({ left: 420, behavior: 'smooth' });
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
            </svg>
        </button>
    );
}