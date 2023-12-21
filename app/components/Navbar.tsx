"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./style/navbar.module.css";

const Navbar = () => {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    return pathname === href ? styles.active : "";
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbar_wrapper}>
        <div className={styles.navbar_logo}>
          <Image src="/logo.svg" alt="Logo" width={315} height={45} />
        </div>
        <div>
          <ul>
            <li className={isLinkActive("/trackers")}>
              <Image
                src="/trackers.svg"
                alt="Trackers icon"
                width={24}
                height={24}
              />
              <Link href="/trackers">Trackers</Link>
            </li>
            <li className={isLinkActive("/history")}>
              <Image
                src="/history.svg"
                alt="History icon"
                width={24}
                height={24}
              />
              <Link href="/history">History</Link>
            </li>
            <li>
              <Image
                src="/logout.svg"
                alt="Logout icon"
                width={24}
                height={24}
              />
              <Link href="/">Logout</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
