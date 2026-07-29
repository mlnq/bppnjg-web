import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Row } from '../../components';
import { api, konferencjaId } from '../../data/api';

type Props = { dayNumber: number };

export function KonferencjaRow({ dayNumber }: Props) {
  const navigate = useNavigate();
  // The list is a small, independent request. It shares its cache with the
  // conference-list screen, while the heavier player content loads only once
  // the user opens the conference.
  const { data: konferencje } = useQuery({
    queryKey: ['konferencje'],
    queryFn: () => api.getKonferencje(),
  });
  const konferencja = konferencje?.find(({ id }) => id === konferencjaId(dayNumber));

  return (
    <Row
      icon="book"
      tone="rose"
      title="Konferencja dnia"
      meta={konferencja?.tytul ?? 'Zostanie dodana przed etapem'}
      onClick={() => navigate('/konferencja/' + (konferencja?.id ?? konferencjaId(dayNumber)))}
    />
  );
}
