import styles from "./ShrinkOnHoverWrapper.module.css";

export default function ShrinkOnHoverWrapper({children}) {
  return (
    <div className={styles.wrapper}>
      {children}
    </div>
  );
}