import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    organizationId?: string;
  }

  interface Session {
    user: User & { id?: string; role?: string; organizationId?: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    organizationId?: string;
    organizationName?: string;
  }
}
