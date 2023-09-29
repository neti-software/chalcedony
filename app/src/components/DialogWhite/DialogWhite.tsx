import { FC, ReactNode } from "react";
import styles from "./DialogWhite.module.scss";

const DialogWhite: FC<{
  isOpen: boolean;
  handleClose: () => void;
  children: ReactNode;
}> = ({ isOpen, handleClose, children }) => {
  return (
    <>
      {isOpen && <div className={styles.backdrop} />}
      <div className={styles.dialog}>
        {isOpen && (
          <div className={styles.modal}>
            <button className={styles.close} onClick={handleClose}>
              HIDE
            </button>
            {children}
          </div>
        )}
      </div>
    </>
  );
};
export default DialogWhite;
