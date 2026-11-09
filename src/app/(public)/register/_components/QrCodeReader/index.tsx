"use client";

import dynamic from "next/dynamic";

import styles from "./QrCodeReader.module.css";

// Rendered only in the browser: the reader's library needs the camera and
// other browser APIs, so it must never run on the server. `ssr: false` is
// only allowed in a Client Component, hence this wrapper.
const QrCodeReader = dynamic(() => import("./QrCodeReader"), {
  ssr: false,
  loading: () => <div className={styles.frame} aria-hidden />,
});

export default QrCodeReader;
