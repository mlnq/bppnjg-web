import { useParams, useNavigate } from 'react-router-dom';
import { Reader } from '../../components';
import { CONTENT_MAP } from '../../data/content';

export function NiezbednikReader() {
  const { modul } = useParams<{ modul: string }>();
  const navigate = useNavigate();
  const m = CONTENT_MAP[modul ?? ''] ?? CONTENT_MAP.modlitewnik;

  return (
    <Reader
      title={m.modul}
      onBack={() => navigate(-1)}
      kickerIcon={m.ic}
      kickerTone={m.kolor}
      kickerLabel={m.sub}
      headline={m.tytul}
      akapity={m.akapity}
    />
  );
}
