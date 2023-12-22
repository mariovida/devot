"use client";
import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword  } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "./style/login.module.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = React.useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const auth = getAuth();

    try {
      await signInWithEmailAndPassword(auth, username, password);
      router.push("/trackers");
    } catch (error: any) {
      console.log(error.message);
      if(error.message == 'Firebase: Error (auth/invalid-email).') {
        setErrorMessage('Invalid email address.');
      } else if(error.message == 'Firebase: Error (auth/invalid-credential).') {
        setErrorMessage('Invalid credentials..');
      }
    }
  };

  return (
    <div className={styles.login_box}>
      <form onSubmit={(e) => e.preventDefault()} className={styles.login_form}>
        <h3>Login</h3>
        <input
          type="text"
          id="username"
          value={username}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          className={styles.login_form_input}
          required
        />
        <input
          type="password"
          id="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className={styles.login_form_input}
          required
        />
        <button
          type="button"
          onClick={handleLogin}
          className={styles.login_form_submit}
        >
          Login
        </button>
        {errorMessage && <p className={styles.error_message}>{errorMessage}</p>}
      </form>
      <div className={styles.login_register}>
        <div className={styles.login_register_img}>
          <Image
            src="/register-user.svg"
            alt="Register user icon"
            width={100}
            height={100}
          />
        </div>
        <div>
          <p>Need an account?</p>
          <Link href="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
