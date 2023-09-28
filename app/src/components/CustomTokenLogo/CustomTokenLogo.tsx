import styles from "./CustomTokenLogo.module.scss";
import defaultIcon from "../../images/tokeIcon.svg";
import { FC, ReactNode } from "react";

const CustomTokenLogo: FC<{ icon?: string; children?: ReactNode }> = ({
  children,
  icon,
}) => {
  return (
    <div className={styles.logo}>
      <img src={icon ?? defaultIcon} alt="token-icon" />
      {children}
    </div>
  );
};

export default CustomTokenLogo;
