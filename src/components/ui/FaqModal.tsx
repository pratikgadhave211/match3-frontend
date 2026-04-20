import { useEffect, useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqModalProps {
  faqs: FaqItem[];
}

export default function FaqModal({ faqs }: FaqModalProps) {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <button
        type="button"
        id="faq"
        className="landing-faq-float-button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="landing-faq-floating-card"
      >
        {open ? "Close FAQ" : "FAQ"}
      </button>

      {open ? (
        <div className="landing-faq-float-overlay" onClick={() => setOpen(false)}>
          <section
            id="landing-faq-floating-card"
            className="landing-faq-float-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="landing-faq-float-header">
              <h3>Frequently Asked Questions</h3>
              <button
                type="button"
                className="landing-faq-float-close"
                aria-label="Close FAQ"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <p>Everything you need to know before you start matching.</p>

            <div className="landing-faq-float-list">
              {faqs.map((faq) => (
                <details key={faq.question} className="landing-faq-item">
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
