import Navigation from "./Navigation";
import styles from "../styles/Home.module.css";
import Footer from "./Footer";

export default function Home() {
  return (
    <div className={styles.noMargin}>
      <Navigation />
      <div className={styles.homeIntroduction}>
        <div className={styles.backgroundImage}></div>
        <div className={styles.textContainer}>
          <p className={styles.textIntro1}>Welcome to Food Finder</p>
          <p className={styles.textIntro2}>
            Find your favorite restaurant in Ho Chi Minh City with just one
            click.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
