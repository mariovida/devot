"use client";
import {
  useContext,
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextProps {
  loading: boolean;
  user: any;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  logOut: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({
  children,
}: AuthContextProviderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      setLoading(false);
    };

    checkAuthState();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!loading && !user && pathname !== "/register") {
        router.push("/login");
      }
      if (
        !loading &&
        user &&
        (pathname === "/login" || pathname === "/register" || pathname === "/")
      ) {
        router.push("/trackers");
      }
    });

    return () => unsubscribe();
  }, [loading, pathname, router]);

  const signInWithEmailPassword = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmailPassword = async (
    email: string,
    password: string,
    username: string
  ) => {
    await createUserWithEmailAndPassword(auth, email, password);
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updateProfile(currentUser, { displayName: username });
    }
  };

  const logOut = () => {
    signOut(auth);
    router.push("/login");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: User | null) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithEmailPassword,
        signUpWithEmailPassword,
        logOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within an AuthContextProvider");
  }
  return context;
};
