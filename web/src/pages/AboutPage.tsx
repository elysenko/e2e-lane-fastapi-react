export default function AboutPage() {
  return (
    <section data-testid="about-page">
      <div className="page-head">
        <h1 data-testid="about-title">About Task List</h1>
      </div>
      <div className="card form-card" style={{ maxWidth: 620 }}>
        <p style={{ marginTop: 0, lineHeight: 1.6, color: 'var(--text-muted)' }}>
          Task List is a simple, no-friction way to keep track of what needs doing. Browse
          your tasks, mark progress with clear status badges, and add new items in seconds —
          no account required.
        </p>
        <p style={{ marginBottom: 0, lineHeight: 1.6, color: 'var(--text-muted)' }}>
          Every task you create is saved, so your list is right where you left it the next
          time you visit.
        </p>
      </div>
    </section>
  );
}
