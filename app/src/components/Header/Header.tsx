import { FC } from "react";
import WalletConnector from "../WalletConnector";
import styles from "./Header.module.scss";

const Header: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.menu}>
        <div className={styles.pages}></div>
        <div className={styles.pages}>
          <a href={"/create"} rel="noreferrer">
            Create
          </a>
        </div>
      </div>
      <div className={styles.wallet}>
        <WalletConnector />
      </div>
    </div>
  );
};

export default Header;
