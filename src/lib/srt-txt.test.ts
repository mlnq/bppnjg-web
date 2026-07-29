import { describe, it, expect } from 'vitest';
import { srtNaAkapity, srtNaCues, txtNaAkapity } from './srt-txt';

describe('txtNaAkapity', () => {
  it('splits on blank lines into paragraphs', () => {
    const txt = 'Pierwszy akapit.\n\nDrugi akapit\nz dwoma liniami.\n\nTrzeci.';
    expect(txtNaAkapity(txt)).toEqual([
      { typ: 'p', t: 'Pierwszy akapit.' },
      { typ: 'p', t: 'Drugi akapit z dwoma liniami.' },
      { typ: 'p', t: 'Trzeci.' },
    ]);
  });

  it('ignores trailing whitespace and empty input', () => {
    expect(txtNaAkapity('   \n\n  ')).toEqual([]);
  });
});

describe('srtNaAkapity', () => {
  const srt = [
    '1',
    '00:00:00,000 --> 00:00:02,000',
    'Pierwsze zdanie.',
    '',
    '2',
    '00:00:02,500 --> 00:00:04,000',
    'Drugie zdanie, ta sama pauza.',
    '',
    '3',
    '00:00:10,000 --> 00:00:12,000',
    'Nowy akapit po dłuższej ciszy.',
  ].join('\n');

  it('merges cues separated by a short gap into one paragraph', () => {
    const akapity = srtNaAkapity(srt);
    expect(akapity[0]).toEqual({ typ: 'p', t: 'Pierwsze zdanie. Drugie zdanie, ta sama pauza.' });
  });

  it('starts a new paragraph after a gap longer than progMs', () => {
    const akapity = srtNaAkapity(srt);
    expect(akapity).toHaveLength(2);
    expect(akapity[1]).toEqual({ typ: 'p', t: 'Nowy akapit po dłuższej ciszy.' });
  });
});

describe('srtNaCues', () => {
  it('preserves timestamps and text for synchronized playback', () => {
    expect(srtNaCues('1\n00:00:01,250 --> 00:00:03,500\nPierwszy tekst')).toEqual([
      { start: 1250, end: 3500, text: 'Pierwszy tekst' },
    ]);
  });
});
