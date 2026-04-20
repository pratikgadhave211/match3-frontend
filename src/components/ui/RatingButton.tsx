import { useEffect, useState } from "react";

export default function RatingButton() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  const handleSubmit = () => {
    if (!rating) return;
    setSent(true);
  };

  return (
    <>
      <button
        type="button"
        className="landing-rating-button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="landing-rating-card"
        aria-label="Open rating"
        title="Open rating"
      >
        <span className="landing-rating-button-emoji" aria-hidden="true">
          📝
        </span>
      </button>

      {open ? (
        <section id="landing-rating-card" className="landing-rating-card">
          <div className="landing-rating-card-header">
            <h3>Rate MATCH3</h3>
            <button
              type="button"
              className="landing-rating-close"
              onClick={() => setOpen(false)}
              aria-label="Close rating"
            >
              ×
            </button>
          </div>

          <p className="landing-rating-caption">Share feedback and select your rating.</p>

          <textarea
            className="landing-rating-textarea"
            placeholder="Tell us what you liked or what we should improve"
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            rows={4}
          />

          <div className="landing-rating-stars" role="radiogroup" aria-label="5 star rating">
            {Array.from({ length: 5 }, (_, index) => {
              const starValue = index + 1;
              const activeValue = hovered || rating;
              const isActive = activeValue >= starValue;

              return (
                <button
                  key={starValue}
                  type="button"
                  role="radio"
                  aria-checked={rating === starValue}
                  className={`landing-rating-star ${isActive ? "is-active" : ""}`}
                  onMouseEnter={() => setHovered(starValue)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(starValue)}
                >
                  ★
                </button>
              );
            })}
          </div>

          {sent ? <p className="landing-rating-success">Thanks for the feedback.</p> : null}

          <button
            type="button"
            className="landing-rating-submit"
            onClick={handleSubmit}
            disabled={!rating}
          >
            Submit
          </button>
        </section>
      ) : null}
    </>
  );
}
