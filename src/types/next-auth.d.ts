import "next-auth";
import "next-auth/jwt";

type Role = "USER" | "ADMIN";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role?: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
