import React from 'react';
import styles from '../styles/PopupModal.module.css';
import { IoMdClose } from 'react-icons/io';

export default function PopupModal({ title, desc, display }: { title: string, desc?: string, display: boolean }) {
  const [onDisplay, setOnDisplay] = React.useState(display);

  return (
    <div className={styles.backgroundContainer} style={onDisplay ? { display: 'flex' } : { display: 'none' }}>
      <div className={styles.modalContainer} style={onDisplay ? { display: 'block' } : { display: 'none' }}>
        <IoMdClose
          className={styles.modalCloseIcon}
          onClick={() => {
            if (onDisplay) {
              setOnDisplay(false);
            }
          }}
        />
        <p className={styles.modalTitle}>{title}</p>
        <p className={styles.modalDesc}>{desc}</p>
        <div className={styles.modalBtnContainer}>
          <button
            className={styles.modalBtnClose}
            onClick={() => {
              if (onDisplay) {
                setOnDisplay(false);
              }
            }}
          >Close</button>
        </div>
      </div>
    </div>
  )
}
