import { Link } from 'react-router-dom';

const ADMIN_LINKS = [
  { to: '/admin/import', label: 'Nhập dữ liệu Excel' },
  { to: '/admin/kml', label: 'Nhập KML/KMZ' },
  { to: '/admin/villages', label: 'Làng' },
  { to: '/admin/sites', label: 'Điểm tham quan' },
  { to: '/admin/heritage-buildings', label: 'Công trình di sản' },
  { to: '/admin/data', label: 'Dữ liệu khác' },
];


type Props = {
  current: string;
};

export function AdminNav({ current }: Props) {
  return (
    <nav className="admin-import__nav admin-nav">
      {ADMIN_LINKS.map((link) =>
        link.to === current ? (
          <span key={link.to} className="admin-nav__item admin-nav__item--active" aria-current="page">
            {link.label}
          </span>
        ) : (
          <Link key={link.to} to={link.to} className="admin-nav__item">
            {link.label}
          </Link>
        ),
      )}
    </nav>
  );
}
