import Link from "next/link";

export function Landing() {
  return (
    <main className="landing">
      <div className="landing-inner">
        <p className="eyebrow">Standard guitar · E A D G B E</p>
        <h1 className="wordmark">Wooden Chord</h1>
        <p className="lede landing-lede">
          Three ways to look at the neck. The whole fretboard, the chord up close, or a song
          lesson that sets the changes beside the scale.
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
            <em>Song lesson</em>
            <strong>The songs</strong>
            <p>
              The Thrill Is Gone in B minor, and Born Under a Bad Sign in C♯. The rhythm neck
              takes the changes. The lead neck keeps the blues scale.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
