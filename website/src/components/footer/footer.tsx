import { Brand } from '@/components/brand/brand';
import { useCopy } from '@/i18n/use-copy';
import './footer.css';

export function Footer() {
  const { copy } = useCopy();

  return (
    <footer className="footer">
      <div className="shell footer__inner">
        <div className="footer__about">
          <Brand />
          <p>{copy.footer.tagline}</p>
        </div>

        {copy.footer.columns.map((column) => (
          <nav key={column.title} className="footer__column">
            <h3>{column.title}</h3>
            <ul>
              {column.links.map((link) => (
                <li key={link[0]}>
                  <a href={link[1]}>{link[0]}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="shell footer__base">
        <span>{copy.footer.madeBy}</span>
        <span>{copy.footer.license}</span>
      </div>
    </footer>
  );
}
