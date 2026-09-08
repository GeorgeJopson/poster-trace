import Link from "next/link";
import styles from "./BaseButton.module.css";
import React from "react";

export default function BaseButton({children, className, fontSize, href, ...props}:{children:React.ReactNode, className?:string, fontSize?: string, href?:string}) {
    if (href!=null) {
        return (
            <Link className={`${styles.btn} ${className}`} style={{fontSize}} href={href} {...props}>{children}</Link>
        );
    }
    return <button className={`${styles.btn} ${className}`} style={{fontSize}}{...props}>{children}</button>
}
