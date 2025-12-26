import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState } from "react";
import { Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook(
  (): AuthContextValue => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log("Initial session:", session);
        setSession(session);
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed:", _event, session);
        setSession(session);
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    }, []);

    const loadUserProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error loading user profile:", error);
        } else {
          setUser(data as User);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const signUp = async (email: string, password: string, fullName?: string) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          console.log("Sign up error:", error.message);
          return { error };
        }

        console.log("Sign up successful:", data);
        return { error: null };
      } catch (error) {
        console.error("Sign up error:", error);
        return { error: error as AuthError };
      }
    };

    const signIn = async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.log("Sign in error:", error.message);
          return { error };
        }

        console.log("Sign in successful:", data);
        return { error: null };
      } catch (error) {
        console.error("Sign in error:", error);
        return { error: error as AuthError };
      }
    };

    const signOut = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Sign out error:", error);
        } else {
          console.log("Sign out successful");
        }
      } catch (error) {
        console.error("Sign out error:", error);
      }
    };

    return {
      session,
      user,
      isLoading,
      signUp,
      signIn,
      signOut,
    };
  },
  {
    session: null,
    user: null,
    isLoading: true,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signOut: async () => {},
  }
);
