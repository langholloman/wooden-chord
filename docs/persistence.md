# Persistence

The app computes every grip. `voiceChord(instrument, root, quality)` is the whole chord. Scales are the interval tables in `lib/theory/scales.ts`. Nothing is loaded from a database, and the dev server does not need one.

That stays true after accounts exist. A saved view should store the *choices* (which instrument, which root, which quality, which scale, which spelling). The fret numbers should keep coming from `voiceChord`. Two implementations of the same grip will drift, and the check script only guards the TypeScript one.

## Why PostgreSQL

The records we will store are related:

- a person has many saved views
- a view points at one instrument and one tuning
- a tuning is an ordered list of strings
- several views share one instrument

That is a relational model. PostgreSQL is the store to add when those records exist. A document database can hold a view as one blob, and it is a weaker fit once the questions are "every view on this tuning" or "which users saved this instrument".

Do not put the scale interval tables or the guitar grip formulas in the database. They are part of the program. A row that says `scale_id = 'mixolydian'` is enough, and `findScale` remains the definition.

## Tables to add later

These statements are a design sketch. They are not a migration, and nothing in the app connects to them.

```sql
create table users (
  id uuid primary key,
  created_at timestamptz not null default now()
);

create table instruments (
  id text primary key,          -- matches Instrument.id, e.g. guitar-6-standard
  name text not null
);

create table instrument_strings (
  instrument_id text not null references instruments (id),
  position integer not null,    -- 0 is the lowest pitch, same as openPitchClasses
  open_pitch_class smallint not null check (open_pitch_class between 0 and 11),
  open_octave smallint,         -- null until playback needs it
  name text not null,
  primary key (instrument_id, position)
);

create table saved_views (
  id uuid primary key,
  user_id uuid not null references users (id),
  instrument_id text not null references instruments (id),
  root smallint not null check (root between 0 and 11),
  quality text not null check (quality in ('major', 'minor')),
  scale_id text,                -- null means chord only; otherwise a ScaleId
  spelling text not null check (spelling in ('sharp', 'flat')),
  created_at timestamptz not null default now()
);
```

`scale_id` stays a text code rather than a foreign key into a scales table, because the scale list is source code. A check constraint, or a validation step in the API, should reject ids that `findScale` does not know.

When this lands, the API is a thin read and write of `saved_views`. The response to the client can be the stored choices alone. The client already knows how to turn those choices into necks.
