import Link from "next/link";
import styles from "./BaseButton.module.css";
import React from "react";

type BaseButtonProps = React.HTMLAttributes<HTMLElement> & {
    fontSize?: string;
    href?: string;
};

export default function BaseButton({children, className, fontSize, href, ...props}: BaseButtonProps) {
    if (href!=null) {
        return (
            <Link className={`${styles.btn} ${className}`} style={{fontSize}} href={href} {...props}>{children}</Link>
        );
    }
    return <button className={`${styles.btn} ${className}`} style={{fontSize}}{...props}>{children}</button>
}
