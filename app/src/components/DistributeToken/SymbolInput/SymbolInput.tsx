import { ChangeEvent, FC } from "react";
import styles from "./Symbol.module.scss";

type SymbolInputProps = {
  symbol: string;
  value: number | string;
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

const SymbolInput: FC<SymbolInputProps> = ({
  symbol,
  onChange,
  value,
  type = "number",
  min = 0,
  max = 20,
  placeholder,
  disabled = false,
}) => {
  return (
    <div className={styles.symbolInput}>
      <span className={styles.symbol}>{symbol}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
      ></input>
    </div>
  );
};

export default SymbolInput;
