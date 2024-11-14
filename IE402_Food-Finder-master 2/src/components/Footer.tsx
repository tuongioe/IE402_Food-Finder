import styles from '../styles/Footer.module.css';
import logo from "../assets/logo_grayscale.png"

export default function Footer() {
  return (
    <div className={styles.footerContainer}>
      <div>
        <img src={logo} className={styles.footerIconImg} />
        <ul className={styles.footerList}>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </div>
      <div className={styles.footerTextEnd}>
        <p>Copyright&#169; 2024 by Food Finder. All Rights Reserved.</p>
      </div>
    </div>
  )
}
