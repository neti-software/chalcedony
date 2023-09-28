import { ReactNode } from "react";
import styles from "./Layout.module.scss";
import Header from "../Header";

type LayoutProps = {
  children?: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.main}>{children}</div>
    </div>
  );
};

export default Layout;
