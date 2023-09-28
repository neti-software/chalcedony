import Box from "../components/Box";
import CustomTokenLogo from "../components/CustomTokenLogo";
import { useERC20Function } from "../helpers/queries";
import styles from "./Collect.module.scss";

const Collect = () => {
  //   const [searchParams] = useSearchParams();
  //   const fromBase64 = searchParams.get("id");

  const fromBase64 = {
    tokenAddress: "0x0faF6df7054946141266420b43783387A78d82A9",
    amount: 100,
  };

  const { data: tokenName, isLoading: isTokenNameLoading } = useERC20Function(
    [fromBase64.tokenAddress],
    "name"
  );

  const { data: tokenSymbols } = useERC20Function(
    [fromBase64.tokenAddress],
    "symbol"
  );

  const handleCollect = () => {
    return;
  };

  return (
    <div className={styles.container}>
      <div className={styles.collect}>
        <Box className={styles.box}>
          <div className={styles.title}>
            <div>You received an </div>
            <span>Token Voucher</span>
          </div>
          <div className={styles.tokenImage}>
            <CustomTokenLogo>
              <div className={styles.logoContainer}>
                <div className={styles.label}>Value</div>
                <div className={styles.amount}>
                  {fromBase64.amount}{" "}
                  {isTokenNameLoading &&
                  !tokenSymbols?.[fromBase64.tokenAddress]
                    ? ""
                    : tokenSymbols?.[fromBase64.tokenAddress]}
                </div>
              </div>
            </CustomTokenLogo>
          </div>
          <div className={styles.data}>
            <div className={styles.label}>NAME</div>
            <div className={styles.value}>
              {!isTokenNameLoading
                ? tokenName[fromBase64.tokenAddress]
                : "Loading..."}
            </div>
            <div className={styles.label}>TOKEN ADDR:</div>
            <div className={styles.value}>{fromBase64.tokenAddress}</div>
          </div>
        </Box>
      </div>
      <div className={styles.action}>
        <button className={styles.collectButton} onClick={handleCollect}>
          COLLECT
        </button>
      </div>
    </div>
  );
};

export default Collect;
