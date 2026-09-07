import styles from "./BaseButton.module.css";

export default function BaseButton({children, className, fontSize, ...props}) {
  return (
      <button className={`${styles.btn} ${className}`} style={{fontSize}} {...props}>{children}</button>
  );
}
