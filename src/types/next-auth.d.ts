import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: "user" | "admin";
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "user" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin";
    id?: string;
  }
}
