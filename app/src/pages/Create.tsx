import DistributeToken from "../components/DistributeToken";
import styles from "./Create.module.scss";

// const initNewItem: TokensList = {
//   contractAddress: "",
//   symbol: "",
// };

const Create = () => {
  // const [tokensList, setTokenList] =
  //   useState<Array<TokensList>>(TESTNET_TOKEN_LIST);

  // const { signer } = useContext(MainContext);
  // const [{ wallet }] = useConnectWallet();

  // const [newItem, setNewItem] = useState<TokensList>(initNewItem);
  // const onboard = useWeb3Onboard();

  // const { isLoading: tokenBalancesLoading, data: tokenBalances } =
  //   useGetTrustedTokenBalances(
  //     onboard.state.get().wallets?.[0]?.accounts?.[0].address
  //   );

  // const { data: customTokenBalances } = useGetCustomTokenBalance(
  //   onboard.state.get().wallets?.[0]?.accounts?.[0].address,
  //   [newItem.contractAddress],
  //   signer
  // );

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setNewItem((prevState) => {
  //     return {
  //       ...prevState,
  //       [e.target.name]: e.target.value,
  //     };
  //   });
  // };

  // const addNewTokenToList = async () => {
  //   const newList: Array<TokensList> = [...tokensList, newItem];
  //   setTokenList(newList);
  //   setNewItem(initNewItem);
  // };

  // const convertBalance = (contractAddress: string): string => {
  //   const hexBalance = { ...tokenBalances, ...customTokenBalances }?.[
  //     contractAddress.toLowerCase()
  //   ];

  //   let bigNumberValue = BigNumber.from(0);

  //   if (hexBalance) {
  //     bigNumberValue = BigNumber.from(hexBalance);
  //   }

  //   return formatEther(bigNumberValue);
  // };

  return (
    <div className={styles.container}>
      <div className={styles.distribute}>
        <DistributeToken />
      </div>
      {/* <div className={styles.list}>
        <div className={styles.tableContainer}>
          <div className={classNames(styles.tableRow, styles.header)}>
            <div className={styles.rowItem}>Index</div>
            <div className={styles.rowItem}>Symbol</div>
            <div className={styles.rowItem}>Contract address</div>
            <div className={styles.rowItem}>Your Balance</div>
            <div className={styles.rowItem}>Action</div>
          </div>
          {tokensList.map((token: TokensList, index: number) => {
            return (
              <div className={styles.tableRow} key={index}>
                <div className={styles.rowItem}>{index + 1}</div>
                <div className={styles.rowItem}>{token.symbol}</div>
                <div className={styles.rowItem}>{token.contractAddress}</div>
                <div className={styles.rowItem}>
                  {!tokenBalancesLoading
                    ? convertBalance(token.contractAddress)
                    : "Loading..."}
                </div>
                <div className={styles.rowItem}>
                  <button>send this asset !</button>
                </div>
              </div>
            );
          })}
        </div>
      </div> */}
      {/* <div className={styles.addNew}>
        <div>Add new</div>
        <div>
          <div>
            <label>
              Token address (erc-20):
              <input
                type="text"
                name="contractAddress"
                value={newItem.contractAddress}
                onChange={handleChange}
              />
            </label>
          </div>
          <div>
            <label>
              Token symbol
              <input
                type="text"
                name="symbol"
                onChange={handleChange}
                value={newItem.symbol}
              />
            </label>
          </div>
          <div>
            <button onClick={addNewTokenToList}>Add token</button>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Create;
