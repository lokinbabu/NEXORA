import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Feedback.jsx';

/** Blocks store pages that need a login. Remembers where the user was heading. */
export function RequireAuth() {
  const { isAuthed, booting } = useAuth();
  const location = useLocation();
  if (booting) return <div className="page-center"><Spinner size="lg" /></div>;
  if (!isAuthed) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

/** Blocks everything under /admin unless the user is an admin. */
export function RequireAdmin() {
  const { isAuthed, isAdmin, booting } = useAuth();
  const location = useLocation();
  if (booting) return <div className="page-center"><Spinner size="lg" /></div>;
  if (!isAuthed || !isAdmin) return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

/** Sends logged-in users away from login/register screens. */
export function RedirectIfAuthed({ children }) {
  const { isAuthed, isAdmin, booting } = useAuth();
  if (booting) return <div className="page-center"><Spinner size="lg" /></div>;
  if (isAuthed) return <Navigate to={isAdmin ? '/admin' : '/'} replace />;
  return children;
}
