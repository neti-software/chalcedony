import { FC, ReactNode } from "react";
import styles from "./Box.module.scss";
import classNames from "classnames";

export const Box: FC<{ className?: string; children: ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <div className={classNames(styles.container, className)}>{children}</div>
  );
};
