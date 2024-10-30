import { Link } from 'react-router-dom'
import styles from "../styles/Navigation.module.css"
import logo from "../assets/logo.png"

export default function Navigation() {
    return (
        <nav className={styles.navContainer}>
            <Link to="/" className={styles.navIcon}>
                <img src={logo} className={styles.navIconImg} />
            </Link>
            <ul className={styles.navController}>
                <li><Link to="/" className={styles.navLink}>Home</Link></li>
                <li><Link to="/login" className={styles.navLink}>Login</Link></li>
                <li><Link to="/signup" className={styles.navLink}>Sign Up</Link></li>
            </ul>
        </nav>

    )
}
