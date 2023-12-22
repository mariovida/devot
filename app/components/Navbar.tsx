"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAuth } from "../context/AuthContext";
import styles from "./style/navbar.module.css";

const Navbar = () => {
  const { user, logOut } = UserAuth();
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setLoading(false);
    };
    checkAuthentication();
  }, [user]);

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
          {user ? (
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
                <button onClick={handleSignOut}>Logout</button>
              </li>
            </ul>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
