"use client";
import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./style/register.module.css";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    const auth = getAuth();

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      await updateProfile(user, { displayName: username });
      router.push("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.register_box}>
      <form onSubmit={(e) => e.preventDefault()} className={styles.register_form}>
        <h3>Sign Up</h3>
        <input
          type="email"
          id="email"
          value={email}
          placeholder="Email address"
          onChange={(e) => setEmail(e.target.value)}
          className={styles.register_form_input}
          required
        />
        <input
          type="text"
          id="username"
          value={username}
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
          className={styles.register_form_input}
          required
        />
        <input
          type="password"
          id="password"
          value={password}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          className={styles.register_form_input}
          required />
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          placeholder="Confirm password"
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.register_form_input}
          required />
        <button type="button" onClick={handleRegister} className={styles.register_form_submit}>
          Register
        </button>
      </form>
      <div className={styles.register_register}>
        <p>Already have an account?</p>
        <Link href="/login">Login here</Link>
      </div>
    </div>
  );
};

export default RegisterPage;
