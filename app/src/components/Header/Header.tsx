import { FC } from "react";
import styles from "./Header.module.scss";
import WalletConnector from "../WalletConnector";

const Header: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.menu}>
        <div className={styles.pages}>
          <a href={"/pre-collected"} rel="noreferrer">
            Pre-Collected
          </a>
        </div>
        <div className={styles.pages}>
          <a href={"/create"} rel="noreferrer">
            Create
          </a>
        </div>
      </div>
      <div className={styles.wallet}>
        <WalletConnector />
        {/* <button className={styles.more}>. . .</button> */}
      </div>
    </div>
  );
};

export default Header;
