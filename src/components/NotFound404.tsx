import { Link } from 'react-router-dom';
import styles from '../styles/NotFound404.module.css';

export default function NotFound404() {
  return (
    <div className={styles.contentContainer}>
      <div className={styles.imgLayer} />
      <div className={styles.textLayer}>
        <p className={styles.textHeader}>
          404 NOT FOUND
        </p>
        <p className={styles.textInfo}>
          Oops! nothing here...
        </p>
        <p className={styles.textContent}>
          Please check the URL or <Link className={styles.textLink} to="/">CLICK HERE</Link> to redirect to the main page.
        </p>
      </div>
    </div>
  )
}
