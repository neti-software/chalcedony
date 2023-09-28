import DistributeToken from "../components/DistributeToken";
import styles from "./Create.module.scss";

const Create = () => {
  return (
    <div className={styles.container}>
      <div className={styles.distribute}>
        <DistributeToken />
      </div>
    </div>
  );
};

export default Create;
