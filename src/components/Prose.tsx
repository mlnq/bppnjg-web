import type { Akapit } from '../data/types';

type ProseProps = { akapity: Akapit[]; dropcap?: boolean };

export function Prose({ akapity, dropcap }: ProseProps) {
  return (
    <div className="prose">
      {akapity.map((a, i) => {
        if (a.typ === 'h3') return <h3 key={i}>{a.t}</h3>;
        if (a.typ === 'verse') return <span key={i} className="verse">{a.t}</span>;
        if (a.typ === 'resp') return <p key={i} className="resp">{a.t}</p>;
        if (a.typ === 'lead') return <p key={i} className="lead">{a.t}</p>;
        if (a.typ === 'drop') return <p key={i} className={dropcap ? 'dropcap' : ''}>{a.t}</p>;
        return <p key={i}>{a.t}</p>;
      })}
    </div>
  );
}
