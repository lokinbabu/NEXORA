import { Outlet, Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__aside">
        <Logo />
        <div className="auth-shell__pitch">
          <h2>Join the NEXORA ranks.</h2>
          <p>
            One account for orders, faster checkout with saved addresses, and Cash on
            Delivery — no card needed.
          </p>
          <ul className="auth-shell__points">
            <li><span>◆</span> Track every order in real time</li>
            <li><span>◆</span> Addresses saved for one-tap checkout</li>
            <li><span>◆</span> Member pricing on selected gear</li>
          </ul>
        </div>
        <div className="auth-shell__foot">
          <Link to="/">← Back to store</Link>
        </div>
      </div>
      <div className="auth-shell__main">
        <Outlet />
      </div>
    </div>
  );
}
