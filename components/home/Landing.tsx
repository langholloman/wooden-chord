import Link from "next/link";

export function Landing() {
  return (
    <main className="landing">
      <div className="landing-inner">
        <p className="eyebrow">Standard guitar · E A D G B E</p>
        <h1 className="wordmark">Wooden Chord</h1>
        <p className="lede landing-lede">
          Three ways to look at the neck. The whole fretboard, the chord up close, or a lesson
          that plays the changes and the scale together.
        </p>
        <div className="landing-choices">
          <Link href="/neck" className="landing-card">
            <em>Full neck</em>
            <strong>Every fret</strong>
            <p>
              The whole neck, with each note named. Chord tones and the scale stay bright inside
              the fret window. Everything outside that range falls into shadow.
            </p>
          </Link>
          <Link href="/focus" className="landing-card">
            <em>Focused neck</em>
            <strong>The shape</strong>
            <p>
              A short neck on the chord. Each string, fretted or open, leads out to the chord of
              that note. Scale tones stay on the center neck.
            </p>
          </Link>
          <Link href="/thrill" className="landing-card">
            <em>B.B. King · lesson</em>
            <strong>The Thrill Is Gone</strong>
            <p>
              Two necks, one chorus. The rhythm neck moves through the B minor changes. The lead
              neck keeps the blues scale and shows each note as it sounds.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
