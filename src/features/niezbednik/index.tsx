import { useNavigate } from "react-router-dom";
import { Button, Eyebrow, Row, ScreenTools, SectionHead } from "../../components";
import { Icon } from "../../lib/icons";

const TILES = [
  {
    id: "spiewnik",
    nazwa: "Śpiewnik",
    sub: "Pieśni na drogę",
    ic: "music",
    kolor: "rose",
  },
  {
    id: "czytania",
    nazwa: "Czytania",
    sub: "Liturgia dnia",
    ic: "book-open",
    kolor: "amber",
  },
  {
    id: "modlitewnik",
    nazwa: "Modlitewnik",
    sub: "Modlitwy pątnika",
    ic: "book-heart",
    kolor: "green",
  },
  {
    id: "brewiarz",
    nazwa: "Brewiarz",
    sub: "Liturgia godzin",
    ic: "church",
    kolor: "blue",
  },
] as const;

export function NiezbednikScreen() {
  const navigate = useNavigate();
  const onSettings = () => navigate("/ustawienia");

  return (
    <div className="viewport scroll">
      <div className="stage">
        <Eyebrow
          className="enter enter-1"
          style={{ marginBottom: "var(--s3)" }}
        >
          Na drogę i do modlitwy
        </Eyebrow>
        <div className="tiles enter enter-1">
          {TILES.map((k) => (
            <button
              key={k.id}
              className="tile"
              onClick={() => navigate("/niezbednik/" + k.id)}
            >
              <span className={"tile__ic chip--" + k.kolor}>
                <Icon name={k.ic} />
              </span>
              <span style={{ marginTop: "auto" }}>
                <span className="tile__name" style={{ display: "block" }}>
                  {k.nazwa}
                </span>
                <span className="tile__sub">{k.sub}</span>
              </span>
            </button>
          ))}
        </div>

        <SectionHead>Polecane dziś</SectionHead>
        <div className="enter enter-2">
          <Row
            icon="book"
            tone="rose"
            title="Wszystkie konferencje"
            meta="Nagrania i transkrypcje"
            onClick={() => navigate("/konferencja")}
          />
        </div>

        <div className="center mt6">
          <span className="localnote">
            <Icon name="check" />
            Teksty dostępne bez zasięgu
          </span>
        </div>

        <ScreenTools
          right={
            <Button variant="ghost" icon="settings" onClick={onSettings}>
              Ustawienia
            </Button>
          }
        />
      </div>
    </div>
  );
}
