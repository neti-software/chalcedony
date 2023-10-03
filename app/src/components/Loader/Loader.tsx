import { FC } from "react";
import styles from "./Loader.module.scss";

const Loader: FC = () => {
  return (
    <>
      <div className={styles.backdrop} />
      <div className={styles.loader} />
    </>
  );
};
export default Loader;
